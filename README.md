# adaguc-data-explorer

Note: / TODO:

Currently pinning versions to 9.8.0:

```

    "@opengeoweb/theme": "9.8.0",
    "@opengeoweb/webmap-react": "9.8.0",
    "@opengeoweb/webmap": "9.8.0",
```

## Install dependencies:

```
nvm use 20
npm ci
```

## To run the storybook:

In this case the files in folder `stories` are used.

`npm run storybook`

It should automatically show in your browser.

## To run the application:

In this case the files in the folder `src/application` are used.

`npm run start`

and then visit the url http://localhost:4000/ in your browser.

## To build a application

A compiled version using only a javascript and a index.html file can be made with:

`npm run build`

The application is in that case written to the `dist` folder. You run the application in the dist folder via

`npx serve dist`

and then visit the url http://localhost:3000/ in your browser.


## Docker

```
docker build . -t adaguc-data-explorer
docker run -it -e ADAGUC_AUTOWMS_ENDPOINT=https://geoservices.knmi.nl/autowms -p 8080:80 adaguc-data-explorer
# Vist http://localhost:8080/

```