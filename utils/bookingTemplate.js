const Handlebars = require('handlebars');
const Template = require('../models/Template');
const puppeteer = require("puppeteer");
const logger = require('../utils/logger');

// Register date formatting helper
Handlebars.registerHelper('formatDate', function (date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
});


//  Default fallback helper
Handlebars.registerHelper('default', function (value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
});

module.exports = async function generatePdfBuffer(booking, templateName = 'booking_receipt') {
  logger.info('Generating PDF for booking', booking );
  const templateDoc = await Template.findOne({ name: templateName });
  if (!templateDoc) {
    throw new Error(`Template '${templateName}' not found in DB`);
  }

  const compiledTemplate = Handlebars.compile(templateDoc.html);
  const html = compiledTemplate(booking);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
};
