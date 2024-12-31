const { Coupon } = require("../models/masterCouponModel");
const { Property } = require("../models/propertyModel");
const moment = require("moment");

// exports.getCouponDetails = async (req, res) => {
//   try {
//     const coupon = await Coupon.find();
//     if (coupon.length === 0) {
//       return res
//         .status(200)
//         .json({ status: false, message: "No coupons found" });
//     }
//     async function fetchPropertyNames(property_uids) {
//       const promises = property_uids.map(async (id) => {
//         try {
//           const exist = await Property.findOne(
//             { property_uid: id },
//             { property_name: 1, _id: 0 }
//           );
//           return {
//             property_uid: id,
//             property_name: exist?.property_name || "Unknown",
//           };
//         } catch (error) {
//           // Handle error for individual property fetch
//           console.error(`Error fetching property ${id}: ${error.message}`);
//           return { property_uid: id, property_name: "Unknown" };
//         }
//       });
//
//       return Promise.all(promises);
//     }
//
//     const couponDetails = await Promise.all(
//       coupon.map(async (coupon) => {
//         const propertyUids = coupon.property_uids;
//         const propertyNames = await fetchPropertyNames(propertyUids);
//         const couponWithPropertyNames = { ...coupon.toObject(), propertyNames };
//         return couponWithPropertyNames;
//       })
//     );
//     res.status(200).json({
//       status: true,
//       message: "fached all Coupons successfully",
//       data: couponDetails,
//     });
//   } catch (error) {
//     res.status(500).json({ status: false, error: error.message });
//   }
// };

exports.getCouponDetails = async (req, res) => {
  try {
    // Fetch all coupons at once
    const coupons = await Coupon.find();

    if (coupons.length === 0) {
      return res.status(200).json({ status: false, message: "No coupons found" });
    }

    // Function to fetch property names for given property_uids
    const fetchPropertyNames = async (property_uids) => {
      // Fetch all properties in a single query instead of multiple individual queries
      const properties = await Property.find(
        { property_uid: { $in: property_uids } },
        { property_uid: 1, property_name: 1, _id: 0 }
      );

      // Convert properties to a map for quick lookup
      const propertyMap = properties.reduce((acc, property) => {
        acc[property.property_uid] = property.property_name || 'Unknown';
        return acc;
      }, {});

      return property_uids.map(id => ({
        property_uid: id,
        property_name: propertyMap[id] || 'Unknown',
      }));
    };

    // Fetch coupon details with property names in parallel
    const couponDetails = await Promise.all(coupons.map(async (coupon) => {
      const propertyNames = await fetchPropertyNames(coupon.property_uids);
      return { ...coupon.toObject(), propertyNames };
    }));

    // Respond with the coupon details
    res.status(200).json({
      status: true,
      message: "Fetched all coupons successfully",
      data: couponDetails,
    });

  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};


exports.getCouponById = async (req, res) => {
  const couponId = req.params.id;
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(200).json({status: false, message: "Coupon not found" });
    }
    const promises = coupon?.property_uids?.map(async (id) => {
      const exist = await Property.findOne(
        { property_uid: id },
        { property_name: 1, _id: 0 }
      );
      return {property_uid:id,property_name:exist?.property_name?exist.property_name:null};
    });
    const data=await Promise.all(promises);
    const updatedData={...coupon.toObject(),propertyNames:data}
    res.send({
      status: true,
      message: "fetched coupon data successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const formattedExpiry = moment(req.body.expiry, "DD/MM/YYYY").format(
      "DD-MM-YYYY"
    );
    const removedSpacesName = req.body.name.split(" ").join("")
    const coupon = await Coupon.create({
      name: removedSpacesName,
      expiry: formattedExpiry,
      discount_flat: req.body.discount_flat,
      discount_percent: req.body.discount_percent,
      property_uids: req.body.property_uids,
      one_time_use: req.body.one_time_use,
      is_used: false,
    });
    res.status(201).json({
      status: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.verifyCoupon = async (req, res) => {
  try {
    const { coupon_code, property_uid } = req.body;
    // Check if the coupon code exists
    const coupon = await Coupon.findOne({ name: coupon_code ,"property_uids":{"$in": [ property_uid ]}});
    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found",
      });
    }
    // Check if the coupon has already been used
    if (coupon.is_used) {
      return res.status(400).json({
        status: false,
        message: "Coupon has already been used",
      });
    }
    // Check if the coupon has expired
    const currentDate = moment();
    const expiryDate = moment(coupon.expiry, "DD-MM-YYYY");
    if (currentDate.isAfter(expiryDate)) {
      return res.status(400).json({
        status: false,
        message: "Coupon has expired",
      });
    }

    res.status(200).json({
      status: true,
      message: "Coupon verifyed successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

exports.UpdateCouponStatus = async(getcoupon) => {
    const coupon = await Coupon.findOne({ name:getcoupon});
    if (coupon.one_time_use) {
      coupon.is_used = true;
      await coupon.save();
    }
    return Promise.resolve("Coupon applied successfully")

};

exports.updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const formattedExpiry = moment(req.body.expiry, "DD/MM/YYYY").format(
      "DD-MM-YYYY"
    );
    const removedSpacesName = req.body.name.split(" ").join("")

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      {
        name: removedSpacesName,
        expiry: formattedExpiry,
        discount_flat: req.body.discount_flat,
        discount_percent: req.body.discount_percent,
        property_uids: req.body.property_uids,
        one_time_use: req.body.one_time_use,
      },
      { new: true }
    );
    if (!updatedCoupon) {
      return res.status(200).json({status: false, message: "Coupon not found" });
    }

    res.json({
      status: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res.status(200).json({status: false, message: "Coupon not found" });
    }

    res.json({ status: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
