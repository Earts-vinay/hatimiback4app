const express = require("express");
const {
    getBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById
} = require("../controllers/blogController");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.get('/get-blog/:id',getBlogById)
router.post( "/create-blog",createBlog);
router.get("/get-blog", getBlog);
router.put("/update-blog/:id",updateBlog);
router.delete("/delete-blog/:_id",deleteBlog)



module.exports = router;
