export type AffiliateProduct = {
  id: string;
  title: string;
  desc: string;
  image: string;
  price?: string;
  category: "books" | "bundle" | "course" | "tools";
  tags?: string[];
  link: string;
};

export const bmsProductsEN: AffiliateProduct[] = [
  {
    id: "swiftui-essentials",
    title: "SwiftUI Essentials",
    desc: "Learn how Apple architects scalable and maintainable apps. Create observable objects and learn to pass data from screen to screen and much more..",
    image: "/partners/bms/essentials.png",
    price: "$34 USD",
    category: "books",
    tags: ["SwiftUI", "Architecture"],
    link: "https://www.bigmountainstudio.com/essentials/nthu8"
  },
  {
    id: "swiftui-views-mastery",
    title: "SwiftUI Views Mastery",
    desc: "The most COMPLETE visual reference picture book on SwiftUI Views. Layout, Stacks, Grids, Controls, Navigation, Lists... and a lot more.",
    image: "/partners/bms/mastery.png",
    price: "$34 USD",
    category: "books",
    tags: ["SwiftUI", "UI"],
    link: "https://www.bigmountainstudio.com/views/nthu8"
  },
  {
    id: "swiftui--advanced-views-mastery",
    title: "AdvancedSwiftUI Views Mastery",
    desc: "Advanced UI techniques with Paints, Colors effects, Gradients, Shapes, 3D Effects, Gestures, Styling, Image Modifiers, and more.",
    image: "/partners/bms/advanced.png",
    price: "$34 USD",
    category: "books",
    tags: ["SwiftUI", "UI", "Advanced"],
    link: "https://www.bigmountainstudio.com/advanced-views/nthu8"
  },
  {
    id: "swiftui-animations-mastery",
    title: "SwiftUI Animations Mastery",
    desc: "The most COMPLETE visual reference picture book on SwiftUI Animations. Animations, delays, durations, springs, transitions, matched geometry effect, phased animations... it's all here.",
    image: "/partners/bms/animations.png",
    price: "$55 USD",
    category: "books",
    tags: ["SwiftUI", "Animations"],
    link: "https://www.bigmountainstudio.com/animations/nthu8"
  },
  {
    id: "swiftui-swiftdata-mastery",
    title: "SwiftData Mastery in SwiftUI",
    desc: "Learn the latest and simplest way to model, insert, update, delete, and display data in your SwiftUI apps with Apple's new framework.",
    image: "/partners/bms/swiftdata.png",
    price: "$97 USD",
    category: "books",
    tags: ["SwiftUI", "SwiftData"],
    link: "https://www.bigmountainstudio.com/swiftdata/nthu8"
  },
  {
    id: "swiftui-coredata-mastery",
    title: "Core Data Mastery in SwiftUI",
    desc: "The largest Core Data picture book at over 500 pages. The easiest way to learn Core Data and use it in your SwiftUI app today.",
    image: "/partners/bms/coredata.png",
    price: "$97 USD",
    category: "books",
    tags: ["SwiftUI", "CoreData"],
    link: "https://www.bigmountainstudio.com/core-data/nthu8"
  },
  {
    id: "swiftui-charts-mastery",
    title: "SwiftUI Charts Mastery",
    desc: "Transform your app's data into compelling, interactive charts that captivate users with many visual examples and customizations options. Are you ready to master SwiftUI Charts?",
    image: "/partners/bms/charts.png",
    price: "$34 USD",
    category: "books",
    tags: ["SwiftUI", "Charts"],
    link: "https://www.bigmountainstudio.com/charts/nthu8"
  },
  {
    id: "swiftui-combine-mastery",
    title: "Combine Mastery in SwiftUI",
    desc: "Combine is one of the MOST difficult and confusing topics to learn. But over 400 hours of research and work has finally made Combine EASY to learn.",
    image: "/partners/bms/combine.png",
    price: "$147 USD",
    category: "books",
    tags: ["SwiftUI", "Combine"],
    link: "https://www.bigmountainstudio.com/combine/nthu8"
  },
  {
    id: "swiftui-swiftdata-bundle",
    title: "SwiftData SwiftUI 6-Book Bundle",
    desc: "Save 20%! Build your SwiftUI library today so you can build amazing apps. (⭐ Includes SwiftData Mastery)",
    image: "/partners/bms/swiftdatabundle.png",
    price: "$320 USD",
    category: "books",
    tags: ["SwiftUI", "Bundle"],
    link: "https://www.bigmountainstudio.com/swiftdata-bundle/nthu8"
  },
  {
    id: "swiftui-coredata-bundle",
    title: "Core Data SwiftUI 6-Book Bundle",
    desc: "Save 20%! Build your SwiftUI library today so you can build amazing apps. (⭐ Includes Core Data Mastery)",
    image: "/partners/bms/coredatabundle.png",
    price: "$320 USD",
    category: "books",
    tags: ["SwiftUI", "Bundle"],
    link: "https://www.bigmountainstudio.com/book-bundle/nthu8"
  }
];

export const rocketSimProductsEN: AffiliateProduct[] = [
  {
    id: "rocketsim",
    title: "RocketSim",
    desc: "Supercharge your iOS Simulator with advanced debugging tools, universal links testing, device simulation, and much more.",
    image: "/partners/rocketsim/logo.webp",
    price: "Free / Pro plans available",
    category: "tools",
    tags: ["iOS Simulator", "Debugging", "Development Tools"],
    link: "https://join.swiftlee-weekly.com/bc5145f9/"
  }
];

export const bmsStoreEN = "https://www.bigmountainstudio.com/a/nthu8";
export const rocketSimStoreEN = "https://join.swiftlee-weekly.com/bc5145f9/";