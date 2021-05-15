var priceIdOne = 'price_1Ir6YODPMngAtAXMx120sOr3';
var priceIdTwo = 'price_1IqjWQDPMngAtAXMkE3SfI6W';
var priceIdThree = 'price_1IqkrvDPMngAtAXMQPTTUlwx';
var publishableKey = 'pk_test_51IqjT1DPMngAtAXMpqjXaGTX1AHlNB3Shk6ZmYtBqRGutydaHTkNW6gLld1LQvt4iI2nztJF7EBhxtCy5R55bxRu00huxmxMST';


// If a fetch error occurs, log it to the console and show it in the UI.
var handleFetchResult = function(result) {
  if (!result.ok) {
    return result.json().then(function(json) {
      if (json.error && json.error.message) {
        throw new Error(result.url + ' ' + result.status + ' ' + json.error.message);
      }
    }).catch(function(err) {
      showErrorMessage(err);
      throw err;
    });
  }
  return result.json();
};

// Create a Checkout Session with the selected plan ID
var createCheckoutSession = function(priceId) {
  return fetch("/creators/create-creator-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      priceId: priceId
    })
  }).then(handleFetchResult);
};

// Handle any errors returned from Checkout
var handleResult = function(result) {
  if (result.error) {
    showErrorMessage(result.error.message);
  }
};

var showErrorMessage = function(message) {
  var errorEl = document.getElementById("error-message")
  errorEl.textContent = message;
  errorEl.style.display = "block";
};

var stripe = Stripe(publishableKey);
// Setup event handler to create a Checkout Session when button is clicked


document
  .getElementById("checkout-1")
  .addEventListener("click", function(evt) {
    createCheckoutSession(priceIdOne).then(function(data) {
      // Call Stripe.js method to redirect to the new Checkout page
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId
        })
        .then(handleResult);
    });
  });

document
  .getElementById("checkout-2")
  .addEventListener("click", function(evt) {
    createCheckoutSession(priceIdTwo).then(function(data) {
      // Call Stripe.js method to redirect to the new Checkout page
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId
        })
        .then(handleResult);
    });
  });

document
  .getElementById("checkout-3")
  .addEventListener("click", function(evt) {
    createCheckoutSession(priceIdThree).then(function(data) {
      // Call Stripe.js method to redirect to the new Checkout page
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId
        })
        .then(handleResult);
    });
  });
