import { ExtensionContext, Uri, window, workspace } from "vscode";
import fetch from "node-fetch";
import { FileDownloader, getApi } from "@microsoft/vscode-file-downloader-api";
import { readFile, writeFile } from "fs";

import { TOKEN_KEY } from "./constants";
import { Octokit } from "octokit";
import path = require("path");

export const showBaseList = async (context: ExtensionContext) => {
  const responseItems = await getBaseContent(context);
  const bases: any[] = (<any[]>responseItems).map((item) => {
    return {
      label: item.name,
      download: item.download_url,
      description: item.html_url,
    };
  });

  try {
    const selectedBaseOption = await window.showQuickPick(bases, {
      canPickMany: false,
      title: "Select a base for your tsconfig.json",
      placeHolder: "Select a base",
    });

    if (selectedBaseOption !== null) {
      try {
        const fileDownloader: FileDownloader = await getApi();
        const downloadedFileUri: Uri = await fileDownloader.downloadFile(
          Uri.parse(selectedBaseOption.download),
          `${selectedBaseOption.lable}-tsconfig.json`,
          context
        );

        const destinationFolder = workspace.workspaceFolders![0].uri;
        readFile(path.resolve(downloadedFileUri.fsPath), (err, data) => {
          writeFile(
            path.resolve(destinationFolder.fsPath, "tsconfig.json"),
            data,
            () => {
              window.showInformationMessage(
                "You are good to go! tsconfig.json file saved successfully"
              );
            }
          );
        });
      } catch (_) {}
    }
  } catch (ignored) {
    console.log(ignored);
  }
};

const getBaseContent = async (context: ExtensionContext) => {
  const octokit = new Octokit({
    auth: context.globalState.get(TOKEN_KEY),
    request: {
      fetch,
    },
  });

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: "tsconfig",
      repo: "bases",
      path: "bases",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return response.data;
};

const askForToken = async (context: ExtensionContext) => {
  const token = await window.showInputBox({
    placeHolder: "Please insert your github token",
    prompt: "Github Token",
    password: true,
  });

  if (token === "") {
    window.showErrorMessage("You must insert a token to start using it.");
    return;
  }

  const { globalState } = context;
  globalState.update(TOKEN_KEY, token);
  showBaseList(context);
};

export const checkUserTokenOrRun = (context: ExtensionContext) => {
  const { globalState } = context;

  const token = globalState.get(TOKEN_KEY);

  if (!token) {
    window.showErrorMessage("Please provide a github token");
    askForToken(context);
    return;
  } else {
    showBaseList(context);
  }
};
