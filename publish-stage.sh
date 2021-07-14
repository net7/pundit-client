CLIENT_ID='550160987680-ovr8h3lmc1l4cutir9ljl2cn7qthrcvp.apps.googleusercontent.com'
CLIENT_SECRET=''
APP_ID="llfgmibngfhofchpapggfebnigkblgkb"
TOKEN_CODE="";
ACCESS_TOKEN="";

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
    curl "https://accounts.google.com/o/oauth2/token" -d \
    "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=$TOKEN_CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
    echo "\n\n"
    echo "Now copy and paste the access_token from the JSON response above \n"
    read -p "Paste access_token from response
    " ACCESS_TOKEN
fi

echo "\nUPDATE STORE ITEM\n"
curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-X PUT \
-T dist/chrome-ext-stage.zip \
-v \
https://www.googleapis.com/upload/chromewebstore/v1.1/items/$APP_ID

echo "\nPUBLISH STORE ITEM\n"
curl \
-H "Authorization: Bearer $ACCESS_TOKEN"  \
-H "x-goog-api-version: 2" \
-H "Content-Length: 0" \
-X POST \
-v \
https://www.googleapis.com/chromewebstore/v1.1/items/$APP_ID/publish?publishTarget=trustedTesters