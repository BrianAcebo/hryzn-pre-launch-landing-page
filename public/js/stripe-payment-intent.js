// Create a Stripe client
var stripe = Stripe('pk_test_51IqjT1DPMngAtAXMpqjXaGTX1AHlNB3Shk6ZmYtBqRGutydaHTkNW6gLld1LQvt4iI2nztJF7EBhxtCy5R55bxRu00huxmxMST');

// // Set up Stripe.js and Elements to use in checkout form
// var elements = stripe.elements();
// var style = {
//   base: {
//     color: "#32325d",
//   }
// };
//
// var card = elements.create("card", { style: style });
// card.mount("#card-element");
//
// // Handle real-time validation errors from the card Element.
// card.addEventListener('change', function(event) {
//   var displayError = document.getElementById('card-errors');
//   if (event.error) {
//     displayError.textContent = event.error.message;
//   } else {
//     displayError.textContent = '';
//   }
// });
//
// // Handle form submission
// var form = document.getElementById('payment-form');
// form.addEventListener('submit', function(event) {
//   event.preventDefault();
//
//   stripe.createToken(card).then(function(result) {
//     if (result.error) {
//       // Inform the user if there was an error
//       var errorElement = document.getElementById('card-errors');
//       errorElement.textContent = result.error.message;
//     } else {
//       // Send the token to your server
//       stripeTokenHandler(result.token);
//     }
//   });
// });

var paymentForm = document.getElementById("payment-form");
var paymentAmount = document.getElementById("currency-field");
var paymentIntentData = {
  // You might send a list of items the customer is purchasing so that you can compute
  // the price on the server.
  items: [{ id: "photo-subscription" }],
  currency: "usd"
};

// Secret from the server, which we'll overwrite each time we create a new payment intent.
var paymentIntentClientSecret = null;

// Set up Stripe.js and Elements to use in checkout form
var setupElements = function(data) {
  stripe = Stripe(data.publishableKey);
  var elements = stripe.elements();
  var style = {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4"
      }
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    }
  };

  var card = elements.create("card", { style: style });
  card.mount("#card-element");

  // Handle form submission.
  paymentForm.addEventListener("submit", function(event) {
    event.preventDefault();
    // Initiate payment when the submit button is clicked
    pay(stripe, card, paymentIntentClientSecret);
  });
};

/*
  * Calls stripe.confirmCardPayment which creates a pop-up modal to
  * prompt the user to enter extra authentication details without leaving your page
  */
var pay = function(stripe, card, clientSecret) {
  changeLoadingState(true);

  // Initiate the payment.
  // If authentication is required, confirmCardPayment will automatically display a modal
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card
      }
    })
    .then(function(result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      } else {
        // The payment has been processed!
        orderComplete(clientSecret);
      }
    });
};

const updatePaymentIntent = (account, shouldSetupElements = false) => {
  // Disable the button while we fetch the payment intent.
  paymentForm.querySelector("button").disabled = true;

  // The account will be used as the transfer_data[destination] parameter when creating the
  // PaymentIntent on the server side.
	paymentIntentData.account = account;

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
			paymentIntentClientSecret = data.clientSecret
			if (shouldSetupElements) {
				setupElements(data);
			}

			paymentForm.querySelector("button").disabled = false;
    });
}

// When the selected account changes, create a new PaymentIntent on the server
// side and update the front-end accordingly.
var enabledAccounts = document.querySelector("#currency-field")
enabledAccounts.addEventListener("change", function(event) {
	updatePaymentIntent(enabledAccounts.value);
});

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function(clientSecret) {
  // Just for the purpose of the sample, show the PaymentIntent response object
  stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    var paymentIntent = result.paymentIntent;
    var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

    document.querySelector(".sr-payment-form").classList.add("hidden");
    document.querySelector("pre").textContent = paymentIntentJson;

    document.querySelector(".sr-result").classList.remove("hidden");
    setTimeout(function() {
      document.querySelector(".sr-result").classList.add("expand");
    }, 200);

    changeLoadingState(false);
  });
};

var showError = function(errorMsgText) {
  changeLoadingState(false);
  var errorMsg = document.querySelector(".sr-field-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function() {
    errorMsg.textContent = "";
  }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};
