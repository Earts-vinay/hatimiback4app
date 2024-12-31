const express = require("express");
const authRoute = require("./authRoutes");
const propertyRoute = require("./propertyRoutes");
const roomRoute = require("./roomRoutes");
const masterCompanyDetails = require("./masterCompanyDetailsRoutes");
const blogRoute = require("./blogRoutes");
const masterPropertyRoutes = require("./masterPropertyRoutes");
const masterRoomRoutes = require("./masterRoomRoutes");
const masterExtraServiceRoutes = require("./masterExtraServicesRoutes");
const masterTaxesRoutes = require("./masterTaxRoutes");
const masterCoponRoutes = require("./masterCouponRoutes");
const bookingRoutes = require("./bookingRoutes");
const masterRoleRoutes = require("./masterRoleRoutes");
const employeeRoutes = require("./employeeRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const leaveRoutes = require("./leaveRoutes");
const shiftRoutes = require("./shiftRoutes");
const taskRoutes = require("./taskRoutes");
const reviewRoutes = require("./reviewRoutes");
const contactUsRoutes = require("./contactUsRoutes");


const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/property",
    route: propertyRoute,
  },
  {
    path: "/property/room",
    route: roomRoute,
  },
  {
    path: "/blog",
    route: blogRoute,
  },
  {
    path: "/master/property",
    route: masterPropertyRoutes
  },
  {
    path: "/master/room",
    route: masterRoomRoutes,
  },
  {
    path: "/master/company",
    route: masterCompanyDetails,
  },
  {
    path: "/master/extra",
    route: masterExtraServiceRoutes
  },
  {
    path: "/master/tax",
    route: masterTaxesRoutes
  },
  {
    path: "/master/coupon",
    route: masterCoponRoutes
  },
  {
    path: "/booking",
    route: bookingRoutes
  },
  {
    path: "/master/role",
    route: masterRoleRoutes
  },
  {
    path: "/employee",
    route: employeeRoutes
  },
  {
    path: "/attendance",
    route: attendanceRoutes
  },
  {
    path: "/leave",
    route: leaveRoutes
  },
  {
    path: "/shift",
    route: shiftRoutes
  },
  {
    path: "/task",
    route: taskRoutes
  },
  {
    path: "/review",
    route: reviewRoutes,
  },
  {
    path: "/contact",
    route: contactUsRoutes,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
