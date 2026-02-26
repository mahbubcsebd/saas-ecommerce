
const express = require("express");
const router = express.Router();
const {
  createLandingPage,
  getAllLandingPages,
  getLandingPageBySlug,
  getLandingPageById,
  updateLandingPage,
  deleteLandingPage,
  trackConversion,
  getLandingPageAnalytics,
  duplicateLandingPage
} = require("../controllers/landing-page.controller");
const { authenticate, isAdmin } = require("../middlewares/auth.middleware");
const { singleImageUpload } = require("../middlewares/upload.middleware");

// Public Access
router.get("/public/:slug", getLandingPageBySlug);
router.post("/track-conversion", trackConversion);

// Admin Access
router.get("/admin/:id", authenticate, isAdmin, getLandingPageById);
router.get("/", authenticate, isAdmin, getAllLandingPages);
router.get("/:id/analytics", authenticate, isAdmin, getLandingPageAnalytics);

router.post("/:id/duplicate", authenticate, isAdmin, duplicateLandingPage);

router.post(
  "/",
  authenticate,
  isAdmin,
  singleImageUpload("landing-pages", "heroImage"),
  createLandingPage
);
router.put(
  "/:id",
  authenticate,
  isAdmin,
  singleImageUpload("landing-pages", "heroImage"),
  updateLandingPage
);
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  deleteLandingPage
);


module.exports = router;
