CLIENT_ID='550160987680-ovr8h3lmc1l4cutir9ljl2cn7qthrcvp.apps.googleusercontent.com'
CLIENT_SECRET=''
APP_ID="eilojhemeemnpfmailfeiggpgilblaco"
TOKEN_CODE="";
ACCESS_TOKEN="";
CHROME_EXT_DIR="chrome-ext-prod"

cd dist
if [ -d "$CHROME_EXT_DIR" ]; then
    if [ -f "$CHROME_EXT_DIR.zip" ]; then
        echo "Remove old zip file ${CHROME_EXT_DIR}.zip"
        rm $CHROME_EXT_DIR.zip
    fi
    echo "Creating zip file ${CHROME_EXT_DIR}.zip"
    zip -r ${CHROME_EXT_DIR}.zip ${CHROME_EXT_DIR}
    echo "Created zip file ${CHROME_EXT_DIR}.zip\n"
else
    echo "Directory $CHROME_EXT_DIR not exists"
    exit 0;
fi

while getopts ":t:c:a:s:" opt; do
    case "$opt" in
    t)  ACCESS_TOKEN=$OPTARG
        ;;
    c)  TOKEN_CODE=$OPTARG
        ;;
    a)  APP_ID=$OPTARG
        ;;
    s)  CLIENT_SECRET=$OPTARG
        ;;
    esac
done

if [  [-z ${TOKEN_CODE}]  && [ -z ${ACCESS_TOKEN} ]]
then
    read -p "Retrieve code from
    https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=$CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob
    and paste the code you get here:
    " TOKEN_CODE
    echo "\n\n"
fi

if [  -z ${ACCESS_TOKEN} ]
then
    ACCESS_TOKEN=$(curl "https://accounts.google.com/o/oauth2/token" -d \
    "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=$TOKEN_CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob" | 
    node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin')).access_token;")
    if [ -z ${ACCESS_TOKEN} ];
    then
        echo "Impossible to get access_token"
        exit 0;
    else
        echo "ACCESS_TOKEN: $ACCESS_TOKEN" ;
    fi;
fi

echo "\nUPDATE STORE ITEM\n"
UPDATE_RESP=$(curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T "$CHROME_EXT_DIR.zip" \
-v \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$APP_ID |
node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin'));")

UPDATE_STATUS=$(node -pe "var resp=$UPDATE_RESP; resp.uploadState;")
if [ UPDATE_STATUS != "SUCCESS" ]
then
    echo "STATUS $UPDATE_STATUS"
    echo "Error on update item ${CHROME_EXT_DIR}.zip. Authentication failed $UPDATE_RESP"
    exit 0;
fi

echo "\nPUBLISH STORE ITEM\n"
curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-H "Content-Length: 0" \
-X POST \
-v \
https://www.googleapis.com/chromewebstore/v1.1/items/$APP_ID/publish?publishTarget=default

exit;