const core = require('@actions/core');
const github = require('@actions/github');
const {Translate} = require('@google-cloud/translate').v2;

const octokit = github.getOctokit(core.getInput('repo-token'));

const translate = new Translate({
    projectId: core.getInput('google-project-id'),
    credentials: JSON.parse(core.getInput('google-credentials')),
});

const TL_ICON = core.getInput('translation-emoji');
const TL_TITLE_SPLITER = '||';

const main = async () => {
    core.debug(JSON.stringify(github, undefined, 2));

    const lang1 = core.getInput('language-1'); // e.g. en
    const lang2 = core.getInput('language-2'); // e.g. ko

    if (github.context.eventName === 'issue_comment') {
        await translateIssueComment(octokit, github.context.payload, lang1, lang2);
    } else if (github.context.eventName === 'pull_request_review_comment') {
        await translateReviewComment(octokit, github.context.payload, lang1, lang2);
    } else if (github.context.eventName === 'pull_request') {
        await translatePullRequest(octokit, github.context.payload, lang1, lang2);
    } else {
        core.setFailed(`Unsupported trigger event: ${github.context.eventName}`);
    }
}

const translatePullRequest = async (octokit, payload, lang1, lang2) => {
    const title = payload.pull_request.title;
    const desc = payload.pull_request.body;
    let tanslatedTitle = title;
    let tanslatedDesc = desc;
    if (!title.includes(TL_TITLE_SPLITER)) {
        const tanslatedTitle = await translateText(title, lang1, lang2);
    }

    if (!desc.includes(getTranslationLabel(payload.pull_request.number))) {
        tanslatedDesc = await translateText(desc, lang1, lang2);
    }

    await octokit.rest.pulls.update({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        pull_number: payload.pull_request.number,
        title: `${title} ${TL_TITLE_SPLITER} ${tanslatedTitle}`,
        body: formatDesc(desc, tanslatedDesc, payload.pull_request.number)
    });
}

const translateIssueComment = async (octokit, payload, lang1, lang2) => {
    const comment = payload.comment.body;

    if (!comment) {
        return;
    }

    const translation = await translateText(comment, lang1, lang2);

    await octokit.rest.issues.updateComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        comment_id: payload.comment.id,
        body: formatDesc(comment, translation, payload.comment.id)
    });

}

const translateReviewComment = async (octokit, payload, lang1, lang2) => {
    const comment = payload.comment.body;

    if (!comment) {
        return;
    }

    const translation = await translateText(comment, lang1, lang2);

    await octokit.rest.pulls.updateReviewComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        comment_id: payload.comment.id,
        body: formatDesc(comment, translation, payload.comment.id)
    });

}

const translateText = async (text, lang1, lang2) => {
    if (!text) {
        core.debug('empty text for translation');
        return '';
    }

    let [detections] = await translate.detect(text);
    detections = Array.isArray(detections) ? detections : [detections];

    let targetLang = lang1;
    if (detections.length && detections[0].language === lang1) {
        targetLang = lang2;
    }

    const [translation] = await translate.translate(text, targetLang);
    return translation;
}

const getTranslationTextLabel = (id) => `**[Translation]** (id: ${id})`;

const getTranslationLabel = (id) => `${TL_ICON} ${getTranslationTextLabel(id)}`;

const formatDesc = (text, translation, id) => {
    return `${text}
<br>${getTranslationLabel(id)}
<br>${translation}`;
}

try {
    main();
} catch (error) {
    core.error(error);
    core.setFailed(error.message);
}
