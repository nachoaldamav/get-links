import inquirer from "inquirer";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";

async function main() {
  const args = process.argv.slice(2);
  const path = join(process.cwd(), args[0]);
  const markdown = await readFile(path, "utf8");
  const lines = markdown.split("\n");

  const getLinks = (line) => {
    const links = [];
    // Match this regex [link](title) - description
    const regex = /\[(.+)\]\((.+)\)\s-\s(.+)/g;
    let match;
    while ((match = regex.exec(line))) {
      links.push({
        title: match[1],
        url: match[2],
        description: match[3],
      });
    }
    return links;
  };

  const links = lines.flatMap(getLinks);

  for await (const link of links) {
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "correct",
        message: `Is this link correct? ${link.url}`,
      },
      {
        type: "input",
        name: "title",
        message: "Do you want to change the title?",
        default: link.title,
        when: (answers) => answers.correct,
      },
      {
        type: "input",
        name: "description",
        message: "Do you want to change the description?",
        default: link.description,
        when: (answers) => answers.correct,
      },
    ]);

    if (!response.correct) {
      console.log("Skipping link");
      continue;
    }

    // Read json file
    const json = await readFile("links.json", "utf8").catch(() => "[]");
    const data = JSON.parse(json);

    // Update json file
    data.push({
      ...link,
      description: response.description,
      title: response.title,
    });
    await writeFile("links.json", JSON.stringify(data, null, 2));
  }
}

main();
