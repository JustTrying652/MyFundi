 
#!/bin/bash
echo "Creating google-services.json from environment variable..."
echo $GOOGLE_SERVICES_JSON > ./google-services.json
echo "Done!"