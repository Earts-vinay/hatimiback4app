const Blog = require("../models/blogModel");
const { v4: uuidv4 } = require('uuid');
const createError = require("http-errors");


exports.getBlog = async (req, res) => {
try {
    const blogs = await Blog.find();
    res.status(200).json({ message: "fetched Blog data successfully",blogs });
  } catch (error) {
    res.status(500).json({status:false, error: error.message });
  }
}

exports.createBlog = async (req, res) => {
    try {
      const { title, description, imageUrl,details } = req.body;
      // Create a new blog post
      const newBlog = await Blog.create({
        _id: uuidv4(),
        title,
        description,
        imageUrl,
        details,
      });
  
      res.status(201).json({ message: "Blog created successfully",newBlog });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUT API to update a blog by ID
  exports.updateBlog = async (req, res) => {
    const { _id } = req.params;
  
    try {
      const updatedBlog = await Blog.findByIdAndUpdate(_id, req.body, { new: true });
  
      if (!updatedBlog) {
        return res.status(200).json({status: false, message: 'Blog not found' });
      }
  
      res.json(updatedBlog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  // DELETE API to delete a blog by ID
  exports.deleteBlog = async(req, res) => {
    const { _id } = req.params;
  
    try {
      const deletedBlog = await Blog.findByIdAndDelete(_id);
  
      if (!deletedBlog) {
        return res.status(200).json({status: false, message: 'Blog not found' });
      }
  
      res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  exports.getBlogById=async(req,res)=>{
    const id=req.params.id;
    try {
      const data=await Blog.findById(id)
      if(!data){
        throw createError.NotFound()
      }
      res.send({message:"fetched Blog data successfully",data:data});
      
    } catch (error) {
      console.error(error);
      res
      .status(error.status ? error.status : 500)
      .json({ staus: error.status, error: error.message });
      
    }
  }