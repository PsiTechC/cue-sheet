// // config.js
// module.exports = {
//     JWT_SECRET: 'your_jwt_secret', // Use your actual secret here
//     // You can add other configuration values here as well
//   };
  



// <?xml version="1.0" encoding="UTF-8"?>
// <configuration>
//   <system.webServer>
//     <rewrite>
//       <rules>
//         <!-- Redirect everything except API routes to index.html -->
//         <rule name="React Routes" stopProcessing="true">
//           <match url="^(?!api)(.*)$" />
//           <conditions logicalGrouping="MatchAll" trackAllCaptures="false" />
//           <action type="Rewrite" url="/index.html" />
//         </rule>
//       </rules>
//     </rewrite>
//   </system.webServer>
// </configuration>
