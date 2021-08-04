CLIENT_ID='550160987680-ovr8h3lmc1l4cutir9ljl2cn7qthrcvp.apps.googleusercontent.com'
CLIENT_SECRET=''
APP_ID="llfgmibngfhofchpapggfebnigkblgkb"
TOKEN_CODE="";
ACCESS_TOKEN="";
CHROME_EXT_DIR="chrome-ext-stage"

#PROCESS ARGS
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


#CHECK IF ZIP FILE EXISTS. IF NOT, CREATE A NEW ONE.
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
    exit 1;
fi


#GET CODE FOR OAUHT2 AUTH FLOW
if [  [-z ${TOKEN_CODE}]  && [ -z ${ACCESS_TOKEN} ]]
then
    read -p "Retrieve code from
    https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=$CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob
    and paste the code you get here:
    " TOKEN_CODE
    echo "\n\n"
fi


#GET TOKEN
if [  -z ${ACCESS_TOKEN} ]
then
    ACCESS_TOKEN_RESPONSE=$(curl "https://accounts.google.com/o/oauth2/token" -d \
    "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=$TOKEN_CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob" | 
    node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin'));")
    ACCESS_TOKEN=$(node -pe "var resp=$ACCESS_TOKEN_RESPONSE; resp.access_token;")
    
    #CHECK IF TOKEN IS VALID
    if [ -z ${ACCESS_TOKEN} ];
    then
        echo "Impossible to get access_token. Server response $ACCESS_TOKEN_RESPONSE"
        exit 1;
    else
        echo "ACCESS_TOKEN: $ACCESS_TOKEN" ;
    fi;
fi


#UPDATE ITEM ON STORE
echo "\nUPDATE STORE ITEM\n"
UPDATE_RESP=$(curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T "$CHROME_EXT_DIR.zip" \
-v \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$APP_ID |
node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin'));")


#CHECK UPDATE RESPONSE
UPDATE_STATUS=$(node -pe "var resp=$UPDATE_RESP; resp.uploadState;")
if [ UPDATE_STATUS != "SUCCESS" ]
then
    echo "Error on update item ${CHROME_EXT_DIR}.zip. Authentication failed $UPDATE_RESP"
    exit 1;
fi


#PUBLISH ITEM
echo "\nPUBLISH STORE ITEM\n"
PUBLISH_RESPONSE=$(echo "\nPUBLISH STORE ITEM\n"
curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-H "Content-Length: 0" \
-X POST \
-v \
https://www.googleapis.com/chromewebstore/v1.1/items/$APP_ID/publish?publishTarget=trustedTesters)


#CHECK PUBLISH RESPONSE
PUBLISH_STATUS=$(node -pe "var resp=$PUBLISH_RESPONSE; resp.status.includes('SUCCESS') ? 'SUCCESS' : 'FAIL';")
if [ PUBLISH_STATUS != "SUCCESS" ]
then
    echo "Error on publish item ${CHROME_EXT_DIR}.zip.\n$PUBLISH_RESPONSE"
    exit 1;
fi

exit 0;