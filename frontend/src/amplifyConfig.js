// // import { Amplify } from 'aws-amplify';

// // export const configureAmplify = (accessKeyId, secretAccessKey, bucketName, region) => {
// //   try {
// //     console.log('Configuring Amplify with:');
// //     console.log('Access Key:', accessKeyId);
// //     console.log('Secret Key:', secretAccessKey);
// //     console.log('Bucket Name:', bucketName);
// //     console.log('Region:', region);

// //     Amplify.configure({
// //       Storage: {
// //         AWSS3: {
// //           bucket: bucketName,
// //           region,
// //         },
// //       },
// //     });

// //     console.log('Amplify configured successfully!');
// //   } catch (error) {
// //     console.error('Error configuring Amplify:', error);
// //   }
// // };


// // {
// // 	"Version": "2012-10-17",
// // 	"Statement": [
// // 		{
// // 			"Sid": "AllowPublicRead",
// // 			"Effect": "Allow",
// // 			"Principal": {
// // 				"AWS": "arn:aws:iam::266735801276:user/sk"
// // 			},
// // 			"Action": [
// // 				"s3:ListBucket",
// // 				"s3:GetObject"
// // 			],
// // 			"Resource": [
// // 				"arn:aws:s3:::suue",
// // 				"arn:aws:s3:::suue/*"
// // 			]
// // 		}
// // 	]
// // }

// import { Amplify } from 'aws-amplify';

// export const configureAmplify = (accessKeyId, secretAccessKey, bucketName, region) => {
    
//   try {
//     // console.log('Configuring Amplify with:');
//     // console.log('Access Key:', accessKeyId);
//     // console.log('Secret Key:', secretAccessKey);
//     // console.log('Bucket Name:', bucketName);
//     // console.log('Region:', region);

//     Amplify.configure({
//       Storage: {
//         AWSS3: {
//             bucket: bucketName, // S3 bucket name
//             region: region, // AWS region
//             credentials: {
//                 accessKeyId: accessKeyId,
//                 secretAccessKey: secretAccessKey,
//               },
//         },
//       },
//     });


//   } catch (error) {
//     console.error('Error configuring Amplify:', error);
//   }
// };
