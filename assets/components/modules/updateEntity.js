import fetchHandler from "./fetchHandler.js";

async function updateEntity(url, fullName, mobileNumber, workNumber, address) {
  if (!url || !fullName) return;

  try {
    const response = await fetchHandler(
      url,
      "put",
      {
        fullName: fullName.trim(),
        firstPhone: mobileNumber.trim(),
        secoundPhone: workNumber.trim(),
        address: address.trim(),
      },
      { "Content-Type": "application/json" }
    );

    if (!response?.success) {
      return response?.error || "خطای غیرمنتظره";
    }

    return response;
  } catch (error) {
    console.error(error);
    return error || "خطای غیرمنتظره";
  }
}

export default updateEntity;
