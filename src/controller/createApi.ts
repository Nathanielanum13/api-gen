import { Response, Request } from "express";
import CreateApi from "../utils/interface/CreateApi";
import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";
const logger = require("../utils/log/logger");

const defaultDependencies = [
  "morgan:2.29.4",
  "express:4.18.1",
  "helmet:5.1.1",
  "moment:2.29.4",
  "uuid:8.3.2",
  "winston:3.8.1",
  "dotenv:16.0.1",
];
const defaultDevDependencies = [
  "@types/express:4.17.13",
  "@types/morgan:1.9.3",
  "@types/uuid:8.3.4",
  "ts-node:10.9.1",
  "typescript:4.7.4",
];

const writeToFile = (data: string, path: string, filename: string) => {
  fs.writeFile(`${path}/${filename}`, data, function (err) {
    if (err) {
      logger.error(`Failed to generate ${filename} file. ` + err);
      return;
    }
    logger.info(`File - ${filename} has been generated`);
  });
};

const modelDependency = (depArr: string[] = []) => {
  let depObj: { [x: string]: string } = {};
  depArr.forEach((dep) => {
    const [key, value] = dep.split(":");
    depObj[key] = `^${value}`;
  });
  return JSON.stringify(depObj);
};

const processTemplate = (
  data: string,
  templateValues: { [x: string]: string }
) => {
  let finalString: string = data;

  Object.keys(templateValues).forEach((tempKey) => {
    const searchRegex = new RegExp(`\\$__${tempKey}__\\$`, "gm");
    finalString = finalString.replace(searchRegex, templateValues[tempKey]);
  });
  return finalString;
};

const createAnyFolder = (folderPath: string, name: string) => {
  // 1. Get folder path and trim
  const folderDir =
    folderPath?.charAt(folderPath.length - 1) === "/"
      ? folderPath + name
      : folderPath + `/${name}`;

  // 2. Create folder
  try {
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, {
        recursive: true,
      });
    }
  } catch (err) {
    logger.error("Failed to create folder. " + err);
    return null;
  }

  logger.info(`Folder - ${name} has been created`);

  // 3. Return folder __path + name
  return folderDir;
};

const copyFile = (source: string, destination: string) => {
  fs.copyFile(source, destination, (err) => {
    if (err) {
      logger.error(
        `Failed to move ${source} file to ${destination} file. ` + err
      );
    }
  });
};

const buildStructure = (
  structure: {
    name: string;
    files: { name: string; dep: { [x: string]: string } }[];
    dir: any[];
  },
  projectPath: string
) => {
  // 1. Create folder structure
  const structurePath = createAnyFolder(projectPath, structure?.name);

  // 2. Put in files - if any
  if (structurePath) {
    if (structure.files.length) {
      structure?.files?.forEach(({ name, dep }) => {
        const baseProjectDir = path.resolve("./");
        const templateDir = baseProjectDir + "/src/template/";

        const templateValueKeys = Object.keys(dep)

        if (templateValueKeys.length) {
          fs.readFile(templateDir + name + ".ag", "utf8", function (err, data) {
            if (err) {
              logger.error(`Failed to read ${name} template file. ` + err);
              return null;
            }
            let finalString: string = processTemplate(data, dep);
            writeToFile(
              prettier.format(finalString, { parser: "typescript" }),
              structurePath,
              name
            );
          })
        }
        // copyFile(templateDir + name + ".ag", structurePath + `/${name}`);
      });
    }

    // Repeat process for sub directories
    if (structure.dir.length) {
      structure.dir.forEach(
        (dirStructure: {
          name: string;
          files: { name: string; dep: { [x: string]: string } }[];
          dir: string[];
        }) => {
          buildStructure(dirStructure, structurePath);
        }
      );
    }
  }
};

const initialiseProject = (projectPath: string, createApiData: CreateApi) => {
  const baseProjectDir = path.resolve("./");
  const templateDir = baseProjectDir + "/src/template/";

  const trimedProjectName = createApiData?.project
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase();

  const PACKAGE_JSON_TEMPLATE = templateDir + "package.json.ag";
  const ENV_TEMPLATE = templateDir + ".env.ag";

  // Write package.json file
  fs.readFile(PACKAGE_JSON_TEMPLATE, "utf8", function (err, data) {
    if (err) {
      logger.error("Failed to read package.json template file. " + err);
      return null;
    }

    const repoUrl = createApiData?.properties?.repoUrl;
    const rawRepoUrl =
      repoUrl.charAt(repoUrl.length - 1) === "/"
        ? repoUrl.slice(0, -5)
        : repoUrl.slice(0, -4);

    const dependencies = modelDependency([
      ...defaultDependencies,
      ...(createApiData?.properties?.packages?.dependencies || []),
    ]);

    const devDependencies = modelDependency([
      ...defaultDevDependencies,
      ...(createApiData?.properties?.packages?.devDependencies || []),
    ]);

    const templateValues: { [x: string]: string } = {
      "ag.project.name": createApiData?.project || "app",
      "ag.project.git.repo": repoUrl || "",
      "ag.project.author": createApiData?.properties?.author || "",
      "ag.project.git.bug.url": rawRepoUrl + "/issues",
      "ag.project.git.readme.url": rawRepoUrl + "#readme",
      "ag.project.dep": dependencies,
      "ag.project.dev.dep": devDependencies,
    };

    const finalString: string = processTemplate(data, templateValues);

    // Write finalString to file
    writeToFile(
      prettier.format(finalString, { parser: "json" }),
      projectPath,
      "package.json"
    );
  });

  // Write .env file
  fs.readFile(ENV_TEMPLATE, "utf8", function (err, data) {
    if (err) {
      logger.error("Failed to read .env template file. " + err);
      return null;
    }

    const templateValues: { [x: string]: string } = {
      "ag.project.name": trimedProjectName,
      "ag.project.environment":
        createApiData.properties?.variables?.service?.ENVIRONMENT,
      "ag.project.port": createApiData.properties?.variables?.service?.PORT,
      "ag.project.error.log.dir":
        createApiData.properties?.variables?.service?.ERROR_LOG_DIR,
    };

    let finalString: string = processTemplate(data, templateValues);

    const otherVariables: { [x: string]: string } =
      createApiData?.properties?.variables?.local;

    Object.keys(otherVariables).forEach((variableKey) => {
      const trimedVariableKey =
        trimedProjectName +
        "_" +
        variableKey.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();

      finalString =
        finalString +
        "\n" +
        trimedVariableKey +
        "=" +
        otherVariables[variableKey];
    });

    // Write finalString to file
    writeToFile(
      prettier.format(finalString, { parser: "yaml" }),
      projectPath,
      ".env"
    );
  });

  // Write static files and folders
  const projectStructure = [
    {
      name: "src",
      files: [
        {
          name: "app.ts",
          dep: {
            "ag.project.name": trimedProjectName,
          },
        },
      ],
      dir: [
        {
          name: "config",
          files: [
            {
              name: "env.ts",
              dep: {},
            },
          ],
          dir: [],
        },
        {
          name: "controller",
          files: [],
          dir: [],
        },
        {
          name: "utils",
          files: [],
          dir: [
            {
              name: "log",
              files: [
                {
                  name: "logger.ts",
                  dep: {
                    "ag.project.name": trimedProjectName,
                  },
                },
              ],
              dir: [],
            },
          ],
        },
        {
          name: "router",
          files: [
            {
              name: "index.ts",
              dep: {},
            },
          ],
          dir: [],
        },
        {
          name: "middleware",
          files: [],
          dir: [],
        },
      ],
    },
  ];

  projectStructure.forEach((structure) =>
    buildStructure(structure, projectPath)
  );
};

const createProjectFolder = (name: string = "app") => {
  const rootPath = process.env.API_GEN_BUILD_DIR;
  if (rootPath) {
    return createAnyFolder(rootPath, name);
  }
  return null;
};

export default (httpRequest: Request, httpResponse: Response) => {
  const requestPayload: CreateApi = httpRequest.body;
  // 1. Create the project folder
  const folderPath = createProjectFolder(requestPayload.project);

  // 2. Initialise project with package.json and other files
  if (folderPath) {
    const _ = initialiseProject(folderPath, requestPayload);
  }

  return httpResponse.json({ status: "generating..." });
};
