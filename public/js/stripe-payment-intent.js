// Payment for Tips

// Create a Stripe client
var stripe = Stripe('pk_test_51IqjT1DPMngAtAXMpqjXaGTX1AHlNB3Shk6ZmYtBqRGutydaHTkNW6gLld1LQvt4iI2nztJF7EBhxtCy5R55bxRu00huxmxMST');
var paymentIntentClientSecret = null; // Client Secret from the server, which we'll overwrite each time we create a new payment intent.
var tipForm = document.getElementById("tip-form");
var connectedID = document.querySelector("#connected_id");
var paymentIntentData;
var payment_notification_data;

// Set up Stripe.js and Elements to use in checkout form
var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
  }
};

var tip_card = elements.create("card", { style: style });
tip_card.mount("#card-element");

// Handle real-time validation errors from the card Element.
tip_card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Handle form submission
var tip_was_clicked;
var tip_form = document.getElementById('tip-form');
tip_form.addEventListener('submit', function(event) {
  event.preventDefault();

  tip_was_clicked = true;

  var paymentAmount = document.getElementById("currency-field");

  paymentIntentData = {
    // You might send a list of items the customer is purchasing so that you can compute
    // the price on the server.
    items: {
      id: "tip",
      amount: paymentAmount.value
    },
    currency: "usd",
    account: connectedID.value,
    amount: paymentAmount.value
  };

  payment_notification_data = {
    reciever_id: connectedID.value,
    amount: paymentAmount.value,
    payment_id: 'tip'
  };

  updatePaymentIntent(connectedID.value);
});


var pay = function(stripe, card, clientSecret) {
  changeLoadingState(true);

  // Initiate the payment.
  // If authentication is required, confirmCardPayment will automatically display a modal
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card
      },
      setup_future_usage: 'off_session'
    })
    .then(function(result) {
      if (result.error) {
        // Show error to your customer
        var displayError = document.getElementById('card-errors');
        displayError.textContent = result.error.message;
      } else {
        // The payment has been processed!
        orderComplete(clientSecret);
      }
    });
};

const updatePaymentIntent = (account) => {
  // Disable the button while we fetch the payment intent.
  subForm.querySelector("button").disabled = true;
  tipForm.querySelector("button").disabled = true;

  // The account will be used as the transfer_data[destination] parameter when creating the
  // PaymentIntent on the server side.

  fetch("/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(paymentIntentData)
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
			paymentIntentClientSecret = data.clientSecret;

      if (tip_was_clicked) {
        pay(stripe, tip_card, paymentIntentClientSecret);
      }

      if (sub_was_clicked) {
        pay(stripe, sub_card, paymentIntentClientSecret);
      }

      subForm.querySelector("button").disabled = false;
      tipForm.querySelector("button").disabled = false;
    });
}

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function(clientSecret) {

  fetch("/payment-success", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payment_notification_data)
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {

      if (data.subscription_success) {

        document.querySelector(".stripe_form").classList.add("stripe_hidden");

        document.querySelector(".stripe_result").classList.remove("stripe_hidden");

        setTimeout(function() {
          window.location.reload(true)
        }, 3000);

      }

      if (data.tip_success) {

        // Just for the purpose of the sample, show the PaymentIntent response object
        stripe.retrievePaymentIntent(clientSecret).then(function(result) {
          var paymentIntent = result.paymentIntent;
          var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

          document.querySelector(".stripe_form").classList.add("stripe_hidden");
          //document.querySelector(".stripe_result pre").textContent = paymentIntentJson;

          document.querySelector(".stripe_result").classList.remove("stripe_hidden");

          setTimeout(function() {
            document.querySelector(".stripe_result").classList.add("stripe_expand");
          }, 200);

          changeLoadingState(false);
        });

      }

    })
};

// Show a spinner on payment submission
var changeLoadingState = function(isLoading) {

  if (isLoading) {

    if (tip_was_clicked) {
      document.querySelector("#tip-form button").disabled = true;
      //document.querySelector(".stripe_spinner").classList.remove("stripe_hidden");
      document.querySelector("#stripe_button-text").textContent = 'One moment...'
    }

    if (sub_was_clicked) {
      document.querySelector("#subscription-form button").disabled = true;
      //document.querySelector(".stripe_spinner").classList.remove("stripe_hidden");
      document.querySelector("#stripe_button-text_sub").textContent = 'One moment...'
    }

  } else {

    if (tip_was_clicked) {
      document.querySelector("#tip-form button").disabled = false;
      //document.querySelector(".stripe_spinner").classList.add("stripe_hidden");
      document.querySelector("#stripe_button-text").textContent = 'Send Tip'
    }

    if (sub_was_clicked) {
      document.querySelector("#subscription-form button").disabled = false;
      //document.querySelector(".stripe_spinner").classList.add("stripe_hidden");
      document.querySelector("#stripe_button-text_sub").textContent = 'Follow'
    }

  }

};
/**********/

// Payment for Subscriptions

// Create a Stripe client
var paymentIntentClientSecret = null; // Client Secret from the server, which we'll overwrite each time we create a new payment intent.
var subForm = document.getElementById("subscription-form");

// Set up Stripe.js and Elements to use in checkout form
var elements = stripe.elements();
var style = {
  base: {
    color: "#32325d",
  }
};

var sub_card = elements.create("card", { style: style });
sub_card.mount("#card-element_sub");

// Handle real-time validation errors from the card Element.
sub_card.addEventListener('change', function(event) {
  var displayError = document.getElementById('card-errors_sub');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Handle form submission
var sub_was_clicked;
var sub_form = document.getElementById('subscription-form');
sub_form.addEventListener('submit', function(event) {
  event.preventDefault();

  sub_was_clicked = true;

  paymentIntentData = {
    // You might send a list of items the customer is purchasing so that you can compute
    // the price on the server.
    items: {
      id: "subscription"
    },
    currency: "usd",
    account: connectedID.value,
  };

  payment_notification_data = {
    reciever_id: connectedID.value,
    payment_id: 'subscription'
  };

  updatePaymentIntent(connectedID.value);
});
/**********/
