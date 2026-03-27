import { Router } from 'express'
import { homepageController } from './homepage.controller.js'

const router = Router()

// Storefront - Homepage
router.get('/homepage', homepageController.getActiveHomepage)
router.get('/homepage/:slug', homepageController.getSectionBySlug)

export default router
