import { Model } from 'mongoose';
const fetchAggragation = async<T>(Model: Model<T>, projects: string[]) => {
    const projectFields: { [key: string]: number } = projects.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
    }, {} as { [key: string]: number });

    const result = await Model.aggregate([
        {
            $project: projectFields

        }
    ])

    return { [Model.modelName.toLowerCase()]: result }
}

const StatsServices = {
    fetchAggragation
}
export default StatsServices