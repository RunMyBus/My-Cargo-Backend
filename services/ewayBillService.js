const logger = require('../utils/logger');
const axios = require('axios');
const errorCodesMap = require('../utils/EWB_Error_Codes.json');

const ewayBillEmail = process.env.EWB_EMAIL;
const ewayBillUsername = process.env.EWB_USERNAME;
const ewayBillPassword = process.env.EWB_PASSWORD;
const ewayBillBaseUrl = process.env.EWB_BASE_URL;
const ewayBillClientId = process.env.EWB_CLIENT_ID;
const ewayBillClientSecret = process.env.EWB_CLIENT_SECRET;
const ewayBillGstIn = process.env.EWB_GST_IN;
const serverPublicIpAddress = process.env.IP_ADDRESS;

const EWB_Headers = {
    'Content-Type': 'application/json',
    'ip_address': serverPublicIpAddress,
    'client_id': ewayBillClientId,
    'client_secret': ewayBillClientSecret,
    'gstin': ewayBillGstIn
};

const buildEwayBillUrl = (endpoint) => `${ewayBillBaseUrl}/ewaybillapi/v1.03/ewayapi/${endpoint}?email=${ewayBillEmail}`;

const parseErrorCodes = (error) => {
    const errorCodes = JSON.parse(error.message).errorCodes.split(',').filter(code => code.trim());
    const descriptions = errorCodes.map(code => {
        const match = errorCodesMap.find(item => item.errorCode === code);
        return match ? `${match.errorDesc}` : '';
    });
    return { errorCodes, descriptions };
};

const handleEwayBillResponse = async (response, retryOnCode, retryData) => {
    const responseBody = response.data;
    
    // Update vehicle number response
    if (responseBody.status_cd === '1' && ( responseBody.data.transUpdateDate || responseBody.data.vehUpdDate )) {
        logger.info('Successfully updated', { response: responseBody.data });
        return { success: true, message: 'Successfully updated', updatedDate: responseBody.data.transUpdateDate, vehicleUpdateDate: responseBody.data.vehUpdDate };
    }

    // Get waybill details response
    if (responseBody.status_cd === '1' && responseBody.data.ewbNo) {
        logger.info('Successfully fetched', { response: responseBody.data.ewbNo });
        return { success: true, message: 'Successfully fetched', waybillNumber: responseBody.data.ewbNo };
    }

    logger.error('Failed to update/fetch', { response: responseBody });
    if (responseBody.status_desc) {
        return { success: false, message: responseBody.status_desc };
    }

    const { errorCodes, descriptions } = parseErrorCodes(responseBody.error);
    
    // If specified error code (238 - authentications failed) occurs, retry after authentication
    if (errorCodes.includes(retryOnCode)) {
        const authResponse = await authenticate();
        if (authResponse.success) {
            let retryResponse;
            let retryBody;
            if (retryData.endpoint === 'getewaybill') {
                retryResponse = await axios.get(
                    `${buildEwayBillUrl(retryData.endpoint)}&ewbNo=${retryData.body.waybillNumber}`,
                    { headers: EWB_Headers }
                );
                retryBody = retryResponse.data;
                if (retryBody.status_cd === '1' && retryBody.data.ewbNo === retryData.body.waybillNumber) {
                    logger.info('Successfully fetched after authentication', { response: retryBody.data });
                    return { success: true, message: 'Successfully fetched' };
                }
            } else {
                retryResponse = await axios.post(
                    buildEwayBillUrl(retryData.endpoint),
                    retryData.body,
                    { headers: EWB_Headers }
                );
                retryBody = retryResponse.data;
                if (retryBody.status_cd === '1' && retryBody.data.transUpdateDate) {
                    logger.info('Successfully updated after authentication', { response: retryBody.data });
                    return { success: true, message: 'Successfully updated', updatedDate: retryBody.data.transUpdateDate };
                }
            }
        }
    }

    logger.error('Error from eWayBill', { errorCodes, descriptions });

    return {
        success: false,
        message: 'Failed to update/fetch',
        errorCode: errorCodes,
        descriptions
    };
};

const authenticate = async () => {
    try {
        const response = await axios.get(`${ewayBillBaseUrl}/ewaybillapi/v1.03/authenticate?email=${ewayBillEmail}&username=${ewayBillUsername}&password=${ewayBillPassword}`,
            { headers: EWB_Headers }
        );
        if (response.data.status_cd !== '1') {
            logger.error('Authentication failed', { error: response.data });
            return { success: false, error: response.data };
        }
        return { success: true, message: 'Authentication successful' };
    } catch (error) {
        logger.error('Authentication failed', { error: error.message });
        return { success: false, message: error.message };
    }
};

const getWayBillDetails = async (waybillNumber) => {
    logger.info('Getting waybill details', { waybillNumber });
    try {
        const response = await axios.get(`${buildEwayBillUrl('getewaybill')}&ewbNo=${waybillNumber}`,
            { headers: EWB_Headers }
        );
        return handleEwayBillResponse(response, '238', { endpoint: 'getewaybill', body: { waybillNumber } });
    } catch (error) {
        logger.error('Verification failed', { error: error.message });
        return { success: false, message: error.message };
    }
};

const updateTransporter = async (ewbNo, transporterId) => {
    logger.info('Updating vehicle number in eWayBill', { ewbNo, transporterId });
    try {
        const response = await axios.post(
            buildEwayBillUrl('updatetransporter'),
            { ewbNo, transporterId },
            { headers: EWB_Headers }
        );
        
        return handleEwayBillResponse(response, '238', {
            endpoint: 'updatetransporter',
            body: { ewbNo, transporterId }
        });
    } catch (error) {
        logger.error('Error updating transporter', { error: error.message });
        throw error;
    }
};

const updateVehicleNumber = async (body) => {
    logger.info('Updating vehicle number in eWayBill', { body });
    try {
        const response = await axios.post(
            buildEwayBillUrl('vehewb'),
            {
                fromPlace: body.fromPlace,
                fromState: body.fromState,
                reasonCode: "2",
                reasonRem: "Due to Transshipment",
                transMode: "1", // Road
                ewbNo: body.ewbNo,
                vehicleNo: body.vehicleNo
            },
            { headers: EWB_Headers }
        );
        
        return handleEwayBillResponse(response, '238', {
            endpoint: 'vehewb',
            body: {
                fromPlace: body.fromPlace,
                fromState: body.fromState,
                reasonCode: "2",
                reasonRem: "Due to Transshipment",
                transMode: "1", // Road
                ewbNo: body.ewbNo,
                vehicleNo: body.vehicleNo
            }
        });
    } catch (error) {
        logger.error('Error updating eWayBill vehicle number', { error: error.message });
        throw error;
    }
};

module.exports = {
    authenticate,
    updateTransporter,
    updateVehicleNumber,
    getWayBillDetails
};
