const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const ctrl = require('../../controllers/freeeventsController/labTestResultController');

// 🧩 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Custom storage that forces PDFs to use "raw" resource type
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isPDF = ext === 'pdf';

    return {
      folder: 'lab_reports',
      resource_type: isPDF ? 'raw' : 'auto', // 👈 PDFs stored correctly
      format: ext,
      public_id: Date.now() + '-' + Math.round(Math.random() * 1e9),
    };
  },
});

const upload = multer({ storage });

// 📤 Routes
router.post('/', upload.single('file'), ctrl.create);
router.post('/bulk', ctrl.bulkCreate);

router.get('/', ctrl.list);
router.get('/user/:userId', ctrl.listByUser);
router.get('/:id', ctrl.getById);
router.patch('/:id', upload.single('file'), ctrl.update);
router.get('/:id/download', ctrl.download);
router.delete('/:id', ctrl.remove);

module.exports = router;
