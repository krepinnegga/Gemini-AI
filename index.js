const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const fs = require("fs");


// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(filePath, mimeType) {

  const fullPath = require('path').join(__dirname, 'img', filePath); 

  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(fullPath)).toString("base64"),
      mimeType
    },
  };
}

async function run() {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt = "What is going on in this picture?";

  const imageParts = [
    fileToGenerativePart("image1.png", "image/png"),
   // fileToGenerativePart("image2.jpeg", "image/jpeg"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

run();

