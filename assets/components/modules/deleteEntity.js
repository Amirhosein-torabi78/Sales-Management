import fetchHandler from "./fetchHandler.js";

async function deleteEntity(url) {
  if (!url) return;

  try {
    const response = await fetchHandler(url, "delete");
    if (!response?.success) return;
    return response;
  } catch (error) {
    return error;
  }
}

export default deleteEntity;
