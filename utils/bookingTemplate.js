const Handlebars = require('handlebars');
const Template = require('../models/Template');

// Register date formatting helper
Handlebars.registerHelper('formatDate', function (date) {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
});

module.exports = async function generateHTML(booking, templateName = 'booking_receipt') {
  const templateDoc = await Template.findOne({ name: templateName });
  if (!templateDoc) {
    throw new Error(`Template '${templateName}' not found in DB`);
  }

  const compiledTemplate = Handlebars.compile(templateDoc.html);
  return compiledTemplate(booking);
};
