const mongoose = require("mongoose");

// Nested schema for blog details
const BlogDetailsSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
    },
    mainImage: {
      type: String,
    },
    images: {
      type: [String],
    },
    author: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    descriptions: [
      {
        description1: {
          type: String,
        },
        description2: {
          type: String,
        },
        description3: {
          type: String,
        },
        question: {
          type: String,
        },
        bulletPoints: {
          type: [String],
        },
      },
    ],
  },
  {
    _id: false,
    versionKey: false,
  }
);

const blogSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    details: {
      type: BlogDetailsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
