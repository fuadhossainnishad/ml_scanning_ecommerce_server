import express from 'express';
import auth from '../../middleware/auth';
import ProfileController from './profile.controller';


const router = express.Router()

router
    .route('/:id')
    .get(
        auth("User", "Brand"),
        ProfileController.getProfile
    )

router.get(
    ("/"),
    auth("User", "Brand", "Admin"),
    ProfileController.getProfile
)

const ProfileRouter = router;
export default ProfileRouter;