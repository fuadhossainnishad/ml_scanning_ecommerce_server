import AuthRouter from "../module/auth/auth.routes";
import HealthRouter from "../module/health/health.routes";
import express from "express";
import UserRouter from "../module/user/user.routes";
import AdminRouter from "../module/admin/admin.routes";
import NotificationRouter from "../module/notification/notification.routes";
import SettingsRouter from "../module/settings/settings.routes";
// import SubscriptionRouter from "../module/subscription/subscription.routes";
import ProductRouter from "../module/product/product.routes";
import PostRouter from "../module/post/post.routes";
import StatsRouter from "../module/stats/stats.routes";
import BrandRouter from "../module/brand/brand.routes";
import ReviewRouter from "../module/review/review.routes";
import CommentsRouter from "../module/comments/comments.routes";
import ReactRouter from "../module/react/react.routes";
import SavePostRouter from "../module/Save/Save.routes";
import FavouriteRouter from "../module/favourite/favourite.routes";
import CartRouter from "../module/cart/cart.routes";
import FollowRouter from "../module/follow/follow.routes";
import ProfileRouter from "../module/profile/profile.routes";
import PaymentRouter from "../module/payment/payment.routes";
import OrderRouter from "../module/order/order.routes";
import EarningsRouter from "../module/earnings/earnings.routes";
import GraphsRouter from "../module/stats/graph.routes";
import CardRouter from "../module/card/card.routes";
import WithdrawRouter from "../module/withdraw/withdraw.routes";
import RewardRouter from "../module/reward/reward.routes";

const router = express.Router();

const moduleRoutes = [
  { path: "/health", route: HealthRouter },
  { path: "/auth", route: AuthRouter },
  { path: "/user", route: UserRouter },
  { path: '/brand', route: BrandRouter },
  { path: "/admin", route: AdminRouter },
  { path: "/cart", route: CartRouter },
  { path: "/comments", route: CommentsRouter },
  { path: "/earnings", route: EarningsRouter },
  { path: "/favourite", route: FavouriteRouter },
  { path: "/follow", route: FollowRouter },
  { path: "/graph", route: GraphsRouter },
  { path: "/order", route: OrderRouter },
  { path: "/payment", route: PaymentRouter },
  { path: "/profile", route: ProfileRouter },
  { path: "/product", route: ProductRouter },
  { path: "/post", route: PostRouter },
  { path: "/react", route: ReactRouter },
  { path: "/review", route: ReviewRouter },
  { path: "/save_card", route: CardRouter },
  { path: "/savepost", route: SavePostRouter },
  { path: "/settings", route: SettingsRouter },
  { path: "/stats", route: StatsRouter },
  { path: "/reward", route: RewardRouter },
  { path: "/withdraw", route: WithdrawRouter },
  { path: "/notification", route: NotificationRouter },
];

moduleRoutes.forEach((r) => router.use(r.path, r.route));
export default router;
