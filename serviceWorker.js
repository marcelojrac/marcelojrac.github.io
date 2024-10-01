/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5dfd5066'], (function (workbox) { 'use strict';

  workbox.setCacheNameDetails({
    prefix: "paraview-glance-2-"
  });
  self.skipWaiting();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "glance-external-ITKReader.be077ab0b4fe4c19c186.js",
    "revision": null
  }, {
    "url": "glance-external-Workbox.f502707ab4fa90c981e0.js",
    "revision": null
  }, {
    "url": "glance.634a6f59ae9f820a1ec0.js",
    "revision": null
  }, {
    "url": "itk/FloatTypes.js",
    "revision": "d0334ecf8f7df6c4503eaa5bb87cb946"
  }, {
    "url": "itk/IOTypes.js",
    "revision": "0676445d30813fa5c10b47004206a33d"
  }, {
    "url": "itk/Image.js",
    "revision": "bb3b316224c8fb61dea22095e30a29e5"
  }, {
    "url": "itk/ImageIOIndex.js",
    "revision": "3c3f10bc2accd3ef7417685b35876fdf"
  }, {
    "url": "itk/ImageIOs/itkBMPImageIOJSBinding.js",
    "revision": "b69e1e51336e0053ade970f9a4a35906"
  }, {
    "url": "itk/ImageIOs/itkBMPImageIOJSBindingWasm.js",
    "revision": "2b1d834e1026a39c48a79601bad1a885"
  }, {
    "url": "itk/ImageIOs/itkBioRadImageIOJSBinding.js",
    "revision": "2d80328895341622d8f6f424c9f18327"
  }, {
    "url": "itk/ImageIOs/itkBioRadImageIOJSBindingWasm.js",
    "revision": "2a3508641db66e814905fb53ad50096d"
  }, {
    "url": "itk/ImageIOs/itkDCMTKImageIOJSBindingWasm.js",
    "revision": "de62d0a7e061a15efae8480bb74d2ca9"
  }, {
    "url": "itk/ImageIOs/itkDICOMImageSeriesReaderJSBindingWasm.js",
    "revision": "37607df573690058c92cd38d3eabbd31"
  }, {
    "url": "itk/ImageIOs/itkGDCMImageIOJSBindingWasm.js",
    "revision": "aae30aef1c39f9b1f2cd45deea65202e"
  }, {
    "url": "itk/ImageIOs/itkGE4ImageIOJSBinding.js",
    "revision": "1367fc763718b5ad070ac431fa623ae4"
  }, {
    "url": "itk/ImageIOs/itkGE4ImageIOJSBindingWasm.js",
    "revision": "be0dcce7c0cd90c57c9a1cb4729706b4"
  }, {
    "url": "itk/ImageIOs/itkGE5ImageIOJSBinding.js",
    "revision": "7fa430358ce573436b3d3a3e0a71af79"
  }, {
    "url": "itk/ImageIOs/itkGE5ImageIOJSBindingWasm.js",
    "revision": "20e50d4efa21fdc64c646b851524de83"
  }, {
    "url": "itk/ImageIOs/itkGEAdwImageIOJSBinding.js",
    "revision": "a129e1957aac9dfa664725f11512895f"
  }, {
    "url": "itk/ImageIOs/itkGEAdwImageIOJSBindingWasm.js",
    "revision": "7e34d684f2a50b64d8b896c4d356da5f"
  }, {
    "url": "itk/ImageIOs/itkGiplImageIOJSBinding.js",
    "revision": "fe20eae2ede14f9683adc5d21c6da43c"
  }, {
    "url": "itk/ImageIOs/itkGiplImageIOJSBindingWasm.js",
    "revision": "dc1062a636dbf8c399b26f4768f74077"
  }, {
    "url": "itk/ImageIOs/itkHDF5ImageIOJSBindingWasm.js",
    "revision": "909987edb6f2069eec1e2a5fcb596985"
  }, {
    "url": "itk/ImageIOs/itkJPEGImageIOJSBinding.js",
    "revision": "24a0d41aa6dfab25dc7da39a9263f277"
  }, {
    "url": "itk/ImageIOs/itkJPEGImageIOJSBindingWasm.js",
    "revision": "11dbf698a4c3a4132671f572c4e13c69"
  }, {
    "url": "itk/ImageIOs/itkJSONImageIOJSBinding.js",
    "revision": "2298daa1c9e46437741b1daa62aa1de7"
  }, {
    "url": "itk/ImageIOs/itkJSONImageIOJSBindingWasm.js",
    "revision": "a75f63ed48875043bf1bb00aa0e32a41"
  }, {
    "url": "itk/ImageIOs/itkLSMImageIOJSBindingWasm.js",
    "revision": "f03969d2deeb6b5e31abded1ff654a50"
  }, {
    "url": "itk/ImageIOs/itkMGHImageIOJSBinding.js",
    "revision": "97fe784dff5d851cf01df41cc77b0409"
  }, {
    "url": "itk/ImageIOs/itkMGHImageIOJSBindingWasm.js",
    "revision": "8a776c8dd3fe37bbaa79dd9739caa2fc"
  }, {
    "url": "itk/ImageIOs/itkMINCImageIOJSBindingWasm.js",
    "revision": "d5b8a364e439671cacd8f398f4d13d7d"
  }, {
    "url": "itk/ImageIOs/itkMRCImageIOJSBinding.js",
    "revision": "b765dab24d207015a96d6f8500a3e3b1"
  }, {
    "url": "itk/ImageIOs/itkMRCImageIOJSBindingWasm.js",
    "revision": "c897b4336a2cb12821da5543c82b975a"
  }, {
    "url": "itk/ImageIOs/itkMetaImageIOJSBinding.js",
    "revision": "09f2d041a6226ac198fbbada7967f747"
  }, {
    "url": "itk/ImageIOs/itkMetaImageIOJSBindingWasm.js",
    "revision": "1c718be81462f42cfc2f34fd10bd38fe"
  }, {
    "url": "itk/ImageIOs/itkNiftiImageIOJSBinding.js",
    "revision": "b9b5361cd7015b22c9568dd8f42f5835"
  }, {
    "url": "itk/ImageIOs/itkNiftiImageIOJSBindingWasm.js",
    "revision": "ba41080e4d008418532fe7733a294419"
  }, {
    "url": "itk/ImageIOs/itkNrrdImageIOJSBinding.js",
    "revision": "fc26049bcf8aec7df6ceb7d26219da85"
  }, {
    "url": "itk/ImageIOs/itkNrrdImageIOJSBindingWasm.js",
    "revision": "ca72a2331114f947ba64b8e7b6145ae1"
  }, {
    "url": "itk/ImageIOs/itkPNGImageIOJSBinding.js",
    "revision": "6f4ece734fd7be5de385eb1d9a98ad3a"
  }, {
    "url": "itk/ImageIOs/itkPNGImageIOJSBindingWasm.js",
    "revision": "df6c3895c2988704e61ef788b0b917ad"
  }, {
    "url": "itk/ImageIOs/itkTIFFImageIOJSBindingWasm.js",
    "revision": "cfc3ab50820a1fd19c17922c5a97b635"
  }, {
    "url": "itk/ImageIOs/itkVTKImageIOJSBinding.js",
    "revision": "c5a6bf9f22e54b53a1d1cffdf745cd96"
  }, {
    "url": "itk/ImageIOs/itkVTKImageIOJSBindingWasm.js",
    "revision": "e3cd72c19eeaa5003fae879037b69d9e"
  }, {
    "url": "itk/ImageType.js",
    "revision": "0354aa94e0def279c9d2d183a307a4dc"
  }, {
    "url": "itk/IntTypes.js",
    "revision": "22eb75dd39729b6e83e15e9738a744b6"
  }, {
    "url": "itk/Matrix.js",
    "revision": "51476f66fdeef8fcbc92975eede104ee"
  }, {
    "url": "itk/Mesh.js",
    "revision": "7fcb83cd16e75e2bfd3b466fd34e5c81"
  }, {
    "url": "itk/MeshIOIndex.js",
    "revision": "2e038deb932268c26eee62ed8c742bc7"
  }, {
    "url": "itk/MeshIOs/itkVTKPolyDataMeshIOJSBindingWasm.js",
    "revision": "3f620ff2edd52f45ff74795f9901be96"
  }, {
    "url": "itk/MeshType.js",
    "revision": "540b9a4494d10050d572a428290974e2"
  }, {
    "url": "itk/MimeToImageIO.js",
    "revision": "ca9fdab716acbbaa42e77eb3bc59202c"
  }, {
    "url": "itk/MimeToMeshIO.js",
    "revision": "e6f96acd544b81f845756ae5f696c290"
  }, {
    "url": "itk/Pipelines/BinShrink.js",
    "revision": "6ef41389415ba19c63272cc0a619fb9a"
  }, {
    "url": "itk/Pipelines/BinShrinkWasm.js",
    "revision": "875c2379e654ed26145c027487d22a38"
  }, {
    "url": "itk/Pipelines/InputOutputFiles.js",
    "revision": "a95bb114b2030140d7b400a4f5c2c780"
  }, {
    "url": "itk/Pipelines/InputOutputFilesWasm.js",
    "revision": "fb5f381972fbd2a9a5d160a0e55ebc67"
  }, {
    "url": "itk/Pipelines/StdoutStderr.js",
    "revision": "f238c84dc50859ab1ef40d77f0232b03"
  }, {
    "url": "itk/Pipelines/StdoutStderrWasm.js",
    "revision": "9a2e2ef543c406c3ee7f4404d64ec1c8"
  }, {
    "url": "itk/Pipelines/itkJSPipelinePreBinShrink.js",
    "revision": "1474cbea991810984a7814dcdc96d33e"
  }, {
    "url": "itk/Pipelines/itkJSPipelinePreInputOutputFiles.js",
    "revision": "4cc141333502c350588f2664ad94b542"
  }, {
    "url": "itk/Pipelines/itkJSPipelinePreStdoutStderr.js",
    "revision": "51ead2ebb1200bf1dd852b38fb354cd0"
  }, {
    "url": "itk/Pipelines/itkfiltering.js",
    "revision": "58956cdac3c0d8838b771abf7cfdd9e6"
  }, {
    "url": "itk/Pipelines/itkfilteringWasm.js",
    "revision": "e14b48e1bf552a5beebada601e900c8c"
  }, {
    "url": "itk/PixelTypes.js",
    "revision": "2eec9e5aec083c786b2cafcf885e3ccf"
  }, {
    "url": "itk/WebWorkers/ImageIO.worker.js",
    "revision": "b7b1cf95476027d1788388ed602e6ce9"
  }, {
    "url": "itk/WebWorkers/MeshIO.worker.js",
    "revision": "580b050f9d31b5987b9247e9c448ee71"
  }, {
    "url": "itk/WebWorkers/Pipeline.worker.js",
    "revision": "296ed9031a563ccf589f9b56afaa0c8e"
  }, {
    "url": "itk/extensionToImageIO.js",
    "revision": "621c30d33ae3dad668d4f522e30da35b"
  }, {
    "url": "itk/extensionToMeshIO.js",
    "revision": "f065f42ae8e863dd1f1c7f0142a44d58"
  }, {
    "url": "itk/getFileExtension.js",
    "revision": "a41ca1de47ed49c4310bdcecfb035aa9"
  }, {
    "url": "itk/getMatrixElement.js",
    "revision": "b5b833b11487416068b17f1395023a40"
  }, {
    "url": "itk/imageIOComponentToJSComponent.js",
    "revision": "db1d80c3e96dd7133d81eb414e44fd7c"
  }, {
    "url": "itk/imageIOPixelTypeToJSPixelType.js",
    "revision": "8bac11ec37fb155c1d2278ab10f8f5b7"
  }, {
    "url": "itk/imageJSComponentToIOComponent.js",
    "revision": "4e034f21237d9338428c0025fbee8004"
  }, {
    "url": "itk/imageJSPixelTypeToIOPixelType.js",
    "revision": "2680167d52776a3d338ca6640b3f52eb"
  }, {
    "url": "itk/itk-js-cli.js",
    "revision": "c94b55d8f1fd4afec1c917b03c19d8df"
  }, {
    "url": "itk/itkConfig.js",
    "revision": "8fe4b83c9ffde9a18b7d9b01fa13489f"
  }, {
    "url": "itk/loadEmscriptenModuleBrowser.js",
    "revision": "871da9e968874038a56aaaeee17b78c7"
  }, {
    "url": "itk/loadEmscriptenModuleNode.js",
    "revision": "760e452c7ac2ce003e3ffece1c88aa84"
  }, {
    "url": "itk/meshIOComponentToJSComponent.js",
    "revision": "4d044eadc065b7b19f913c492f3b8541"
  }, {
    "url": "itk/meshIOPixelTypeToJSPixelType.js",
    "revision": "731559c63ae2811471c0769ab97823d2"
  }, {
    "url": "itk/meshJSComponentToIOComponent.js",
    "revision": "570183817baa0a6d4ce3764ec43adc3e"
  }, {
    "url": "itk/meshJSPixelTypeToIOPixelType.js",
    "revision": "5e564b0db331dcdb21d4bc3b4d6d08d3"
  }, {
    "url": "itk/node_modules/commander/index.js",
    "revision": "5d56ccd99113d3a04f449b728b07c4c4"
  }, {
    "url": "itk/readImageArrayBuffer.js",
    "revision": "b7a55be7cd08a18f0f0e70c6d8ebf2c0"
  }, {
    "url": "itk/readImageBlob.js",
    "revision": "e1c5f022ea208358e49e78c2d6ae4eb8"
  }, {
    "url": "itk/readImageDICOMFileSeries.js",
    "revision": "367706c0f528383abd8f3a1b168671b1"
  }, {
    "url": "itk/readImageEmscriptenFSDICOMFileSeries.js",
    "revision": "2c6f33ba611fc7f3fcb0fb35e2e9159e"
  }, {
    "url": "itk/readImageEmscriptenFSFile.js",
    "revision": "0f4c34cf423b2b24c655fced218ce6b4"
  }, {
    "url": "itk/readImageFile.js",
    "revision": "6ed6a872a0d58cade325f21f64c1f924"
  }, {
    "url": "itk/readImageLocalDICOMFileSeries.js",
    "revision": "b8197769168384852f9850f18e015579"
  }, {
    "url": "itk/readImageLocalFile.js",
    "revision": "ec47f9cf0803224a35dd136df1227c7b"
  }, {
    "url": "itk/readMeshArrayBuffer.js",
    "revision": "f4b7cc821d263257f3ca5fe3f77c7d40"
  }, {
    "url": "itk/readMeshBlob.js",
    "revision": "03815e9c297f44610299a4ea1221d1b4"
  }, {
    "url": "itk/readMeshEmscriptenFSFile.js",
    "revision": "c023558ad57865475591060636178e61"
  }, {
    "url": "itk/readMeshFile.js",
    "revision": "3ba1ba5281d930f406c200b2cce883b7"
  }, {
    "url": "itk/readMeshLocalFile.js",
    "revision": "02be1b63e2d54ccbd7642243bad86ee3"
  }, {
    "url": "itk/runPipelineBrowser.js",
    "revision": "375b1de92af1ed37313941a62e54ffcd"
  }, {
    "url": "itk/runPipelineEmscripten.js",
    "revision": "44a92caade1616881c908737c7a52547"
  }, {
    "url": "itk/runPipelineNode.js",
    "revision": "f7fddf272a15e5bfd16e9a62aa863ea8"
  }, {
    "url": "itk/setMatrixElement.js",
    "revision": "a0099a7c2321a96954e51816e53c6074"
  }, {
    "url": "itk/writeImageArrayBuffer.js",
    "revision": "cc866f1305499d6d0564986b4d1f7070"
  }, {
    "url": "itk/writeImageEmscriptenFSFile.js",
    "revision": "445f53522dd0ca67b08dc87217a18c4f"
  }, {
    "url": "itk/writeImageLocalFile.js",
    "revision": "9736970846932e2c9e610c9d77a87d35"
  }, {
    "url": "itk/writeMeshArrayBuffer.js",
    "revision": "6fffbd0a398801d90a7a72904bb320d9"
  }, {
    "url": "itk/writeMeshEmscriptenFSFile.js",
    "revision": "4c5c883a6babded2c5130ef66f8993c4"
  }, {
    "url": "itk/writeMeshLocalFile.js",
    "revision": "5892aded0cf4c2c7e8090f9a4ebb71e7"
  }, {
    "url": "runtime.2370d68ba7fab4779949.js",
    "revision": null
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(/(\.css|\.ttf|\.eot|\.woff|\.js|\.png|\.svg|\.wasm)$/, new workbox.NetworkFirst(), 'GET');

}));
