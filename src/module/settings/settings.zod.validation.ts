// import { z } from "zod";

// const rewardsValidation = z.object({
//     code: z.string({ required_error: 'Reward code is required' }).min(1),
//     reward: z.string({ required_error: 'Reward description is required' }).min(1),
//     validity: z.enum(['yes', 'no'], { required_error: 'Validity must be either "yes" or "no"' }),
// });

// const createBlogValidation = z.object({
//     body: z.object({
//         data: z.object({
//             author: z
//                 .string({ required_error: 'Author must be valid string' })
//                 .min(1, 'Name is required'),
//             title: z
//                 .string({ required_error: 'Title must be valid string' })
//                 .min(1, 'Title is required'),
//             description: z
//                 .string({ required_error: 'Description must be valid string' })
//                 .min(1, 'Description is required'),
//             altTag: z
//                 .string({ required_error: 'AltTag must be valid string' })
//                 .min(1, 'Description is required'),
//             rewards: z.array(rewardsValidation),

//         })
//     })
// })

// const updateBlogValidation = z.object({
//     body: z.object({
//         data: z.object({
//             blogId: z.string({ required_error: 'BlogId is required' }),
//             author: z
//                 .string({ required_error: 'Author must be valid string' })
//                 .min(1, 'Name is required')
//                 .optional(),
//             title: z
//                 .string({ required_error: 'Title must be valid string' })
//                 .min(1, 'Title is required')

//                 .optional(),
//             description: z
//                 .string({ required_error: 'Description must be valid string' })
//                 .min(1, 'Description is required')
//                 .optional(),
//             altTag: z
//                 .string({ required_error: 'AltTag must be valid string' })
//                 .min(1, 'Description is required')
//                 .optional(),
//             rewards: z
//                 .array(rewardsValidation)
//                 .optional(),
//         })
//     })
// })

// const deleteBlogValidation = z.object({
//     body: z.object({
//         data: z.object({
//             blogId: z
//                 .string({ required_error: 'BlogId is required' }),
//         })
//     })
// })

// const BlogValidationSchema = {
//     createBlogValidation,
//     updateBlogValidation,
//     deleteBlogValidation
// }

// export default BlogValidationSchema
