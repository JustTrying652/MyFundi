const fs = require('fs');

// EAS injects file secrets as a path in the env variable
const googleServicesPath = process.env.GOOGLE_SERVICES_JSON;
if (googleServicesPath) {
  try {
    // If it's a file path (file type secret), copy it
    if (fs.existsSync(googleServicesPath)) {
      fs.copyFileSync(googleServicesPath, './google-services.json');
      console.log('Copied google-services.json from:', googleServicesPath);
    } else {
      // If it's JSON content (string type secret), write it
      fs.writeFileSync('./google-services.json', googleServicesPath);
      console.log('Written google-services.json from env string');
    }
  } catch (e) {
    console.error('Failed to handle google-services.json:', e);
  }
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
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./icon.png",
        backgroundColor: "#2C3E50"
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.MAPS_API_KEY || ""
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