// Shared Postman tests for fintech APIs
// Note: In Postman, this file would be embedded or referenced via a shared library mechanism.

function assertStatusAndJson(pm, expectedStatus) {
  pm.test(`Status code is ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
  });

  pm.test("Response has JSON body", function () {
    pm.response.to.be.withBody;
    pm.response.to.be.json;
  });
}

function assertSuccessFlag(pm, json) {
  pm.test("Success status flag is true or SUCCESS", function () {
    pm.expect(json).to.have.property("status");
    pm.expect(["SUCCESS", true]).to.include(json.status === true ? true : json.status);
  });
}

function assertTransactionReference(pm, json) {
  pm.test("Transaction reference is present", function () {
    pm.expect(json).to.have.property("transactionReference");
    pm.expect(json.transactionReference).to.be.a("string").and.not.empty;
  });
}

function assertWalletTransferSchema(pm, json) {
  pm.test("Wallet transfer response schema is valid", function () {
    pm.expect(json).to.have.property("status");
    pm.expect(json).to.have.property("transactionReference");
    pm.expect(json).to.have.property("sourceBalance");
    pm.expect(json).to.have.property("destinationBalance");

    pm.expect(json.sourceBalance).to.be.a("number");
    pm.expect(json.destinationBalance).to.be.a("number");
  });
}

function assertPaymentAuthorizationSchema(pm, json) {
  pm.test("Payment authorization response schema is valid", function () {
    pm.expect(json).to.have.property("status");
    pm.expect(json).to.have.property("paymentReference");
    pm.expect(json).to.have.property("amount");
    pm.expect(json).to.have.property("currency");

    pm.expect(json.amount).to.be.a("number");
    pm.expect(json.currency).to.be.a("string");
  });
}

function assertTransactionRequerySchema(pm, json) {
  pm.test("Transaction requery response schema is valid", function () {
    pm.expect(json).to.have.property("transactionReference");
    pm.expect(json).to.have.property("status");
    pm.expect(json).to.have.property("amount");
    pm.expect(json).to.have.property("currency");
    pm.expect(json).to.have.property("channel");

    pm.expect(json.amount).to.be.a("number");
    pm.expect(json.currency).to.be.a("string");
  });
}

module.exports = {
  assertSuccessTransfer: function (pm) {
    assertStatusAndJson(pm, 200);

    const json = pm.response.json();
    assertSuccessFlag(pm, json);
    assertTransactionReference(pm, json);
    assertWalletTransferSchema(pm, json);
  },

  assertPaymentAuthorization: function (pm) {
    assertStatusAndJson(pm, 201);

    const json = pm.response.json();
    pm.test("Payment status is AUTHORIZED", function () {
      pm.expect(json.status).to.eql("AUTHORIZED");
    });

    assertPaymentAuthorizationSchema(pm, json);
  },

  assertTransactionRequery: function (pm) {
    assertStatusAndJson(pm, 200);

    const json = pm.response.json();
    assertTransactionRequerySchema(pm, json);

    pm.test("Transaction status is valid", function () {
      pm.expect(["SUCCESS", "FAILED", "PENDING"]).to.include(json.status);
    });
  }
};

