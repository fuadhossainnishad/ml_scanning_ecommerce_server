import { z } from "zod";
import { SettingType } from "./settings.interface";


const upsertSettingsValidation = z.object({
    body: z.object({
        data: z.object({
            type: z
                .enum(Object.values(SettingType) as [string, ...string[]])
                .refine((val) => Object.values(SettingType).includes(val as SettingType), {
                    message: 'Invalid settings type. Allowed types are "terms_and_conditions" or "privacy_policy".',
                }),
            content: z
                .string({ required_error: 'Content must be a valid string' })
                .min(1, 'Content is required'),
        })

    })
})



const SettingsValidationSchema = {
    upsertSettingsValidation,
}

export default SettingsValidationSchema
