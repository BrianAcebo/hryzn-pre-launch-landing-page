const keys = require('../config/keys');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(keys.sendGridApiKey);

const templates = {
  welcome_wait_list: "d-19411ec9be44483dbd9fb4a119c3d950",
  confirmation_verify_email: "d-742ecdb0f3d4407e82f41ba37779014e"
}

const sendEmail = (emailData) => {

  const msg = {

    // email details
    to: emailData.receiver,
    from: emailData.sender,
    templateId: templates[emailData.templateName],

    // custom dynamic fields
    dynamic_template_data: {
      email: emailData.receiver,
      name: emailData.name,
      share_ref: emailData.share_ref,
      place_in_wait_list: emailData.place_in_wait_list,
      confirm_account_url:  emailData.confirm_account__url,
      reset_password_url: emailData.reset_password_url
    }

  };

  // send the email
  sgMail.send(msg, (error, result) => {
    if (error) {
      console.log(error);
    }
  });

}

exports.sendEmail = sendEmail;
