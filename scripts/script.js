// functions

function httpGet(theUrl, return_headers) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", theUrl, false); // false for synchronous request
	xmlHttp.send(null);
	if (return_headers) {
		return xmlHttp;
	}
	return xmlHttp.responseText;
}

// function to remove duplicates in the object retrieved from api
const removeDuplicate = (obj) => {
	const result = obj.filter(
		(thing, index, self) =>
			index ===
			self.findIndex(
				(t) =>
					t.username === thing.username && t.commiterName === thing.commiterName
			)
	);
	return result;
};

// function to display table in html
const buildTable = (data, repoName) => {
	var div = document.querySelector(".data");

	var title = `<h2 class="repo-title" >Repository - <a target="_blank" href="https://github.com/BTDeveloperCommunity/${repoName}">${repoName}</a></h2>`;

	div.insertAdjacentHTML("beforeend", title);

	var table = `<div class="repo-table" ><table><thead><tr>
                <th>Sl. #</th>
                <th>Name</th>
                <th>GitHub Username</th>
                <th>Number of Commits</th>
            </tr></thead><tbody>`;

	for (let i = 0; i < data.length; i++) {
		var row = `<tr>
				<td>${i + 1}</td>
				<td><table class="nested-table">
        <tr>
            <td><img src="${data[i].avatar}" alt="${
			data[i].commiterName
		}"/></td>
            <td>${data[i].commiterName}</a></td>
        </tr>
    </table></td>
				<td><a target="_blank" href="https://github.com/${data[i].username}">${
			data[i].username
		}</a></td>
				<td>${data[i].commitCount}</td>
			</tr>`;
		table += row;
	}
	table += `</tbody></table></div>`;

	div.insertAdjacentHTML("beforeend", table);
};

// function to get all the repos in the account
function get_repo_list(owner) {
	let url = `https://api.github.com/users/${owner}/repos`;

	let repo = httpGet(url);
	var repoData = JSON.parse(repo);
	var repoList = [];

	for (let i = 0; i < repoData.length; i++) {
		repoList.push(repoData[i].name);
	}

	return repoList;
}

// function to get all commit details in the repo
function get_all_commits(owner, repo, branch) {
	nameList = [];
	avatarList = [];
	usernameList = [];
	commitCount = [];

	let first_commit = get_first_commit(owner, repo);
	let compare_url =
		"https://api.github.com" +
		"/repos/" +
		owner +
		"/" +
		repo +
		"/compare/" +
		first_commit +
		"..." +
		branch;

	let commit_req = httpGet(compare_url);
	var jsonData = JSON.parse(commit_req);

	// copying username, name, avatar to a object and setting default commit count to 1
	for (var i in jsonData.commits) {
		let login = "BTDeveloperCommunity";
		let url = "https://avatars.githubusercontent.com/u/96703040?s=200&v=4";
		nameList.push(jsonData.commits[i].commit.author.name);
		if (jsonData.commits[i].author) {
			usernameList.push(jsonData.commits[i].author.login);
			avatarList.push(jsonData.commits[i].author.avatar_url);
		} else {
			usernameList.push(login);
			avatarList.push(url);
		}
		commitCount.push(1);
	}

	// counting number of commits per person
	const tempObj = {};
	nameList.forEach((person) => {
		tempObj[person] = tempObj[person] ? (tempObj[person] += 1) : 1;
	});

	// mapping required data to new object and removing duplicates
	const data = removeDuplicate(
		nameList.map((element, i) => ({
			commiterName: element,
			username: usernameList[i],
			avatar: avatarList[i],
			commitCount: 1,
		}))
	);

	// assign number of commits to each user
	var keys = Object.keys(tempObj);
	for (let i = 0; i < keys.length; i++) {
		if (keys[i] === data[i].commiterName) {
			data[i].commitCount = tempObj[keys[i]];
		}
	}

	// sort data according to commitNumbers

	data.sort((a, b) => {
		return b.commitCount - a.commitCount;
	});

	return data;
}

// function to get first commit in the repo
function get_first_commit(owner, repo) {
	let url =
		"https://api.github.com" + "/repos/" + owner + "/" + repo + "/commits";
	let req = httpGet(url, true);
	let first_commit_hash = "";
	if (req.getResponseHeader("Link")) {
		let page_url = req
			.getResponseHeader("Link")
			.split(",")[1]
			.split(";")[0]
			.split("<")[1]
			.split(">")[0];
		let req_last_commit = httpGet(page_url);
		let first_commit = JSON.parse(req_last_commit);
		first_commit_hash = first_commit[first_commit.length - 1]["sha"];
	} else {
		let first_commit = JSON.parse(req.responseText);
		first_commit_hash = first_commit[first_commit.length - 1]["sha"];
	}
	return first_commit_hash;
}

// main code

// declaring GitHub account username and branch
let owner = "BTDeveloperCommunity";
let branch = "main";
let reposList = get_repo_list(owner);

for (var i in reposList) {
	// ski
	if (reposList[i] == "dev.bt") {
		continue;
	}
	const data = get_all_commits(owner, reposList[i], branch);
	buildTable(data, reposList[i]);
}
