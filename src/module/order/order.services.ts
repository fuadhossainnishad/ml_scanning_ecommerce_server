import { Request } from "express"
import { PipelineStage } from "mongoose"  // Add this import for proper typing of aggregation stages
import AggregationQueryBuilder from "../../app/builder/Builder"
import Order from "./order.model"
import Product from "../product/product.model"  // Import Product model for brand-specific pipeline
import { PaymentStatus } from "./order.interface"
import { buildMeta } from "../stats/stats.services"
import { idConverter } from "../../utility/idConverter"

const getOrderService = async (req: Request) => {
  const { _id, role } = req.user
  const { cartProductId, orderId } = req.query
  const query = {
    ...Object.fromEntries(
      Object.entries(req.query).filter(([k]) => !['cartProductId', 'orderId'].includes(k))
    ),
    paymentStatus: PaymentStatus.PAID,
    ...(role === 'User' ? { userId: _id } : {}),
    ...(cartProductId ? { "items.cartProductId": await idConverter(cartProductId as string) } : {}),
    ...(orderId ? { _id: await idConverter(orderId as string) } : {})

  }
  console.log("Query getOrderService:", query);

  // For users: Use the original Order-based pipeline (efficient for single user)
  if (role === 'User') {
    const builder = new AggregationQueryBuilder(Order, query)
    builder.filter()
    builder.search(["orderStatus", "items.sellerStatus"])

    const addStages: PipelineStage[] = [
      {
        $lookup: {
          from: "carts",
          localField: "cartId",
          foreignField: "_id",
          as: "cartData",
        },
      },
      { $unwind: "$cartData" },
      {
        $lookup: {
          from: "products",
          let: {
            productIds: {
              $map: {
                input: "$cartData.products",
                as: "p",
                in: {
                  $cond: [
                    { $eq: [{ $type: "$$p.productId" }, 2] },
                    { $toObjectId: "$$p.productId" },
                    "$$p.productId"
                  ]
                }
              }
            }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$productIds"] },
                  ]
                }
              }
            },
            {
              $project: {
                _id: 1,
                productName: 1,
                brandId: 1,
                productImages: 1,
                price: 1,
                discountPrice: 1,
              }
            }
          ],
          as: "productsData"
        }
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $let: {
                  vars: {
                    cartProd: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$cartData.products",
                            cond: {
                              $eq: [
                                "$$this._id",
                                {
                                  $cond: [
                                    { $eq: [{ $type: "$$item.cartProductId" }, 2] },
                                    { $toObjectId: "$$item.cartProductId" },
                                    "$$item.cartProductId"
                                  ]
                                }
                              ]
                            }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $let: {
                      vars: {
                        product: {
                          $cond: {
                            if: { $ne: ["$$cartProd", null] },
                            then: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$productsData",
                                    cond: {
                                      $eq: [
                                        "$$this._id",
                                        {
                                          $cond: [
                                            { $eq: [{ $type: "$$cartProd.productId" }, 2] },
                                            { $toObjectId: "$$cartProd.productId" },
                                            "$$cartProd.productId"
                                          ]
                                        }
                                      ]
                                    }
                                  }
                                },
                                0
                              ]
                            },
                            else: null
                          }
                        }
                      },
                      in: {
                        $mergeObjects: [
                          "$$item",
                          "$$cartProd",
                          "$$product"
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $unset: ["productsData"] },
      { $unset: ["cartData"] }
    ]

    builder.addStages(addStages)
    builder.sort()

    const meta = await builder.countTotal()
    const data = await builder.execute()

    return {
      meta: buildMeta(meta.page, meta.limit, meta.total),
      data
    }
  }

  // For brands: Optimized pipeline starting from Products (filter by brandId) → Carts → Orders
  // This avoids scanning all orders; only processes brand's products and linked orders
  if (role === 'Brand') {
    const brandObjectId = await idConverter(_id)
    console.log("Brand pipeline for _id:", _id, "as ObjectId:", brandObjectId);

    // Base match for products belonging to the brand
    const productMatch: PipelineStage.Match = {
      $match: {
        brandId: brandObjectId,
        isDeleted: { $ne: true }
      }
    }

    // Project only necessary product fields early
    const productProject: PipelineStage.Project = {
      $project: {
        _id: 1,
        brandId: 1,
        productName: 1,
        productImages: 1,
        price: 1,
        discountPrice: 1
      }
    }

    // Build order match with query params
    const orderMatch = {
      paymentStatus: PaymentStatus.PAID,
      isDeleted: { $ne: true },
      ...(cartProductId ? { "items.cartProductId": await idConverter(cartProductId as string) } : {}),
      ...Object.fromEntries(
        Object.entries(req.query).filter(([k]) => k !== 'page' && k !== 'limit' && k !== 'paymentStatus' && k !== 'cartProductId')
      )
    }

    const brandStages: PipelineStage[] = [
      // Lookup to carts that contain these products (reverse lookup)
      {
        $lookup: {
          from: "carts",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$products",
                              as: "p",
                              cond: {
                                $eq: [
                                  {
                                    $cond: [
                                      { $eq: [{ $type: "$$p.productId" }, 2] },
                                      { $toObjectId: "$$p.productId" },
                                      "$$p.productId"
                                    ]
                                  },
                                  "$$productId"
                                ]
                              }
                            }
                          }
                        },
                        0
                      ]
                    },
                    { $ne: ["$isDeleted", false] }
                  ]
                }
              }
            }
          ],
          as: "cartData"
        }
      },
      { $unwind: { path: "$cartData", preserveNullAndEmptyArrays: true } },  // Allow empty if no cart

      // Lookup to orders from cart
      {
        $lookup: {
          from: "orders",
          localField: "cartData._id",
          foreignField: "cartId",
          pipeline: [
            {
              $match: orderMatch
            },
            {
              $project: {
                _id: 1,
                cartId: 1,
                userId: 1,
                userType: 1,
                address: 1,
                items: 1,
                orderStatus: 1,
                paymentStatus: 1,
                sellerStatus: 1,
                remindStatus: 1,
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1
              }
            }
          ],
          as: "orderData"
        }
      },
      { $unwind: { path: "$orderData", preserveNullAndEmptyArrays: true } },

      // Filter out null orders
      { $match: { orderData: { $ne: null } } },

      {
        $lookup: {
          from: "payments",
          localField: "orderData._id",
          foreignField: "orderId",
          as: "payment"
        }
      },
      { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },

      // Group by order to handle multiple products per order
      {
        $group: {
          _id: "$orderData._id",
          order: { $first: "$orderData" },
          products: {
            $push: {
              _id: "$_id",
              brandId: "$brandId",
              productName: "$productName",
              productImages: "$productImages",
              price: "$price",
              discountPrice: "$discountPrice"
            }
          },  // Collect only product info
          cartData: { $first: "$cartData" }
        }
      },

      // Add fields for merged items (flattened product lookup to avoid scope issues)
      {
        $addFields: {
          "order.items": {
            $map: {
              input: "$order.items",
              as: "item",
              in: {
                $let: {
                  vars: {
                    cartProd: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$cartData.products",
                            cond: { $eq: ["$$this._id", { $cond: [{ $eq: [{ $type: "$$item.cartProductId" }, 2] }, { $toObjectId: "$$item.cartProductId" }, "$$item.cartProductId"] }] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $mergeObjects: [
                      "$$item",
                      "$$cartProd",
                      {
                        $cond: {
                          if: { $ne: ["$$cartProd", null] },
                          then: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$products",
                                  cond: { $eq: ["$$this._id", { $cond: [{ $eq: [{ $type: "$$cartProd.productId" }, 2] }, { $toObjectId: "$$cartProd.productId" }, "$$cartProd.productId"] }] }
                                }
                              },
                              0
                            ]
                          },
                          else: null
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },

      // Unwind items for flattening
      { $unwind: { path: "$order.items", preserveNullAndEmptyArrays: true } },

      // Filter to only brand's items
      { $match: { "order.items.brandId": brandObjectId } },

      // Replace root with merged item + order details
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$order.items",
              {
                orderId: "$order._id",
                userId: "$order.userId",
                cartId: "$order.cartId",
                address: "$order.address",
                paymentMethod: { $ifNull: ["$payment.paymentStatus", "card"] },
                paymentStatus: { $ifNull: ["$payment.paymentStatus", "pending"] },
                totalAmount: { $ifNull: ["$payment.amount", "$order.totalAmount"] }
              }
            ]
          }
        }
      },

      // Sort by item createdAt desc
      { $sort: { createdAt: -1 } }
    ]

    const fullPipeline = [productMatch, productProject, ...brandStages]

    // Count total unique items
    const countPipeline = [...fullPipeline, { $count: "total" }]
    const countResult = await Product.aggregate(countPipeline)
    const total = countResult[0]?.total || 0

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Data pipeline with pagination
    const dataPipeline = [...fullPipeline, { $skip: skip }, { $limit: limit }]
    const data = await Product.aggregate(dataPipeline)

    const meta = {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    }

    // Debug
    if (data.length > 0) {
      console.log("Sample merged item brandId:", data[0].brandId);
    }

    return {
      meta: buildMeta(meta.page, meta.limit, meta.total),
      data
    }
  }


  const builder = new AggregationQueryBuilder(Order, { ...query, userId: undefined })
  builder.filter()
  builder.search(["orderStatus", "items"])

  const addStages: PipelineStage[] = [
    {
      $lookup: {
        from: "carts",
        localField: "cartId",
        foreignField: "_id",
        as: "cartData",
      },
    },
    { $unwind: "$cartData" },
    {
      $lookup: {
        from: "products",
        let: {
          productIds: {
            $map: {
              input: "$cartData.products",
              as: "p",
              in: {
                $cond: [
                  { $eq: [{ $type: "$$p.productId" }, 2] },
                  { $toObjectId: "$$p.productId" },
                  "$$p.productId"
                ]
              }
            }
          }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$productIds"] },
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              brandId: 1,
              productImages: 1,
              price: 1,
              discountPrice: 1,
            }
          }
        ],
        as: "productsData"
      }
    },
    {
      $addFields: {
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              $let: {
                vars: {
                  cartProd: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$cartData.products",
                          cond: {
                            $eq: [
                              "$$this._id",
                              {
                                $cond: [
                                  { $eq: [{ $type: "$$item.cartProductId" }, 2] },
                                  { $toObjectId: "$$item.cartProductId" },
                                  "$$item.cartProductId"
                                ]
                              }
                            ]
                          }
                        }
                      },
                      0
                    ]
                  }
                },
                in: {
                  $let: {
                    vars: {
                      product: {
                        $cond: {
                          if: { $ne: ["$$cartProd", null] },
                          then: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$productsData",
                                  cond: {
                                    $eq: [
                                      "$$this._id",
                                      {
                                        $cond: [
                                          { $eq: [{ $type: "$$cartProd.productId" }, 2] },
                                          { $toObjectId: "$$cartProd.productId" },
                                          "$$cartProd.productId"
                                        ]
                                      }
                                    ]
                                  }
                                }
                              },
                              0
                            ]
                          },
                          else: null
                        }
                      }
                    },
                    in: {
                      $mergeObjects: [
                        "$$item",
                        "$$cartProd",
                        "$$product"
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    { $unset: ["productsData"] }
  ]

  builder.addStages(addStages)
  builder.sort()

  const meta = await builder.countTotal()
  const data = await builder.execute()

  return {
    meta: buildMeta(meta.page, meta.limit, meta.total),
    data
  }
}

const OrderServices = {
  getOrderService
}
export default OrderServices