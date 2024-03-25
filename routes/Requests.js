const router = require("express").Router();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);


const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];


//Route Models
const IMGmodel = genAI.getGenerativeModel({ model: "gemini-pro-vision", safetySettings: safetySettings});
const Chatmodel = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings: safetySettings});

// Multer configuration for handling file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['text/plain', 'image/png', 'image/jpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter 
}).single('file');



// Error handling middleware for Multer
router.use((err, req, res, next) => {
    console.error("Multer error:", err);
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


router.post('/request/file', upload, async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // Check if prompt is provided
    if (!prompt) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    let files = [];

    // Handle file if provided

    if(!req.file){
        return res.status(400).json({ error: 'Image not provided' });
    }

    if (req.file) {
      const fileData = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      };
      files.push(fileData);
    } 

    // Process prompt and files with Gemini-Pro-Vision
    const result = await IMGmodel.generateContent([prompt, ...files]);
    const response = result.response.text();

    res.status(200).json({ data: response });
  } catch (error) {
    console.error("File upload error =>",error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//fit route
router.post('/chat', async (req, res) => {
       try {
        const prompt = req.body.prompt;
        console.log(prompt);

        if (!prompt) {
            return res.status(400).json({ error: 'Text prompt is required' });
          }

          const chat =  Chatmodel.startChat({
            history:[
                {
                    role: "user",
                    parts: [{ text: prompt }],
                  },
                  {
                    role: "model",
                    parts: [{ text: "Great to meet you. What would you like to know?" }],
                  },
                ],
               
          })

          const result = await chat.sendMessageStream(prompt);
          const response = result?.response;

          res.status(200).json({ data: response });
       } catch (error) {
         console.error("Chat error =>", error);
         res.status(500).json({ error: 'Internal server error' });
       }
})




module.exports = router;
