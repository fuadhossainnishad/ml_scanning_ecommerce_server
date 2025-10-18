import express from 'express';
import auth from '../../middleware/auth';
import ProfileController from './prifile.controller';


const router = express.Router()

router
    .route('/:id')
    .get(
        auth("User", "Brand"),
        ProfileController.getProfile
    )

const ProfileRouter = router;
export default ProfileRouter;