const fs = require('fs');

// Write google-services.json from env variable during build
if (process.env.GOOGLE_SERVICES_JSON) {
  fs.writeFileSync('./google-services.json', process.env.GOOGLE_SERVICES_JSON);
}

module.exports = {
  expo: {
    name: "MyFundi",
    slug: "MyFundi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./splash.png",
      resizeMode: "contain",
      backgroundColor: "#2C3E50"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      googleServicesFile: "./google-services.json",
      package: "com.ngata.MyFundi",
      adaptiveIcon: {
        foregroundImage: "./icon.png",
        backgroundColor: "#2C3E50"
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_MAPS_API_KEY || ""
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "0ed13a67-5ae4-4166-9d87-33a43ae6ca28"
      }
    }
  }
};