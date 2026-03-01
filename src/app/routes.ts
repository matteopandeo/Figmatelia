import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { ChooseImage } from "./components/ChooseImage";
import { CutYourStamp } from "./components/CutYourStamp";
import { AddDetails } from "./components/AddDetails";
import { PublicStampbook } from "./components/PublicStampbook";
import { OAuthConsent } from "./components/OAuthConsent";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/step1",
    Component: ChooseImage,
  },
  {
    path: "/step2",
    Component: CutYourStamp,
  },
  {
    path: "/step3",
    Component: AddDetails,
  },
  {
    path: "/book/:slug",
    Component: PublicStampbook,
  },
  {
    path: "/oauth/consent",
    Component: OAuthConsent,
  },
]);