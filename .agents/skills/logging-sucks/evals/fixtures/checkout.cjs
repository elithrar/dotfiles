// Synthetic checkout inputs for logging evaluation.
// Existing logger: info/error accept objects; fields use camelCase. No new logger.
async function checkoutWithoutLogs(request, { pay, logger }) {
  try {
    await pay(request.amount);
    return { status: 200 };
  } catch {
    return { status: 503 };
  }
}

async function checkoutWithFailureLogs(request, { pay, logger }) {
  try {
    await pay(request.amount);
    return { status: 200 };
  } catch {
    logger.error({
      event: "checkoutFailed",
      requestId: request.id,
      errorCode: "paymentUnavailable",
      authorization: request.headers.authorization,
    });
    return { status: 503 };
  }
}

// Platform adds timestamp/severity; policy permits requestId, not raw headers.
// The product's accepted policy retains errors and samples success at 10%.
function logCompletion({ requestId, statusCode, durationMs }, logger, random = Math.random) {
  const event = {
    event: "checkoutCompleted", requestId, statusCode, durationMs,
    service: "checkout", outcome: statusCode >= 500 ? "failure" : "success",
    schemaVersion: 1,
  };
  if (statusCode >= 500) logger.error(event);
  else if (random() < 0.1) logger.info(event);
}

module.exports = { checkoutWithoutLogs, checkoutWithFailureLogs, logCompletion };
