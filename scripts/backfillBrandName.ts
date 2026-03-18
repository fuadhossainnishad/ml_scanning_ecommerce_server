import config from '../src/app/config/index';
// scripts/backfillBrandName.ts
import mongoose from "mongoose";
import Product from '../src/module/product/product.model';
import Brand from '../src/module/brand/brand.model';

const backfill = async () => {
    await mongoose.connect(config.database_url as string);
    console.log("Connected to DB");

    const products = await Product.find({ isDeleted: false }).lean();
    console.log(`Found ${products.length} products to backfill`);

    const bulkOps = await Promise.all(
        products.map(async (product) => {
            const brand = await Brand.findById(product.brandId).lean();
            return {
                updateOne: {
                    filter: { _id: product._id },
                    update: { $set: { brandName: brand?.brandName ?? "" } },
                },
            };
        })
    );

    await Product.bulkWrite(bulkOps);
    console.log("✅ Backfill complete");
    await mongoose.disconnect();
};

backfill().catch(console.error);