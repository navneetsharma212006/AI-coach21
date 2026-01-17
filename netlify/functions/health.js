export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      status: "ok",
      message: "AI Interview Coach API is running on Netlify",
    }),
  };
};
