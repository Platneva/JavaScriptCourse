'use strict';

// Объект для разбития строк csv файла на объект твита. 
// Нужно учитывать особенности работы с переносами, точками с запятыми и кавычками
function TwitParser() {
	let items = [];
	let item = '';
	let is_string = false;

	this.parse = line => {
		for (let i = 0; i < line.length; i++) {
			if (line[i] == ';' && !is_string) {
				items.push(item);
				item = '';
			} else if (line[i] == '"') {
				is_string = !is_string;
				if (i > 0 && line[i - 1] == '"') { // Двойная кавычка превращаются в одинарные
					item += '"';
				}
			} else {
				item += line[i];
			}
		}

		// Если строка символов закончилась с открытой кавычной - значит это перенос, возврщаем null и ждем другу строку
		if (is_string) {
			item += "\n";
			return null;
		}

			// Вставляем последний элемент
		items.push(item);

		// Формируем объект твита
		// Tweet Id;Date;Hour;User Name;Nickname;Bio;Tweet content;Favs;RTs;Latitude;Longitude;Country;Place (as appears on Bio);Profile picture;Followers;Following;Listed;Tweet language (ISO 639-1);Tweet Url
		const twit = {
			id       : items[0],
			date     : items[1],
			hour     : items[2],
			username : items[3],
			nickname : items[4],
			bio      : items[5],
			content  : items[6],
			favs     : items[7],
			rts      : items[8],
			latitude : items[9],
			longitude : items[10],
			country  : items[11],
			place    : items[12],
			picture  : items[13],
			followers : items[14],
			following : items[15],
			listed   : items[16],
			language : items[17],
			url : items[18]
		}

		// Сбрасываем состояние
		items = [];
		item = '';

		return twit;
	}
}

function WordCountAnalyse() {
	let words = {};

	// Функция разбития строки на слова
	function parseWords(ss) {
		const delimeters = " \"\t\n,.:;?!/-+="; // Возможные разделители слов
		const url_symbols = ":/."; // Отдельная обработка url - они считаются одним словом, даже если и содержат : / . 
		const exclude_words = [ "#" ];  // Исключения из слов
		let words = [];
		let ws = 0;
		for (let i = 0; i <= ss.length; i++) {
			if (i == ss.length || delimeters.indexOf(ss[i]) >= 0) {
				if (i > ws) {
					let word = ss.substring(ws, i);
					let is_url = word.startsWith('http') && url_symbols.indexOf(ss[i]) >= 0;
					if (!is_url) {
						if (exclude_words.indexOf(word) < 0) {
							words.push(word.toLowerCase());
						}
						ws = i + 1;
					}
				} else {
					ws = i + 1;
				}
			}
		}
		return words;
	}

	this.analyse = (twit) => {
		for (let word of parseWords(twit.content)) {
			if (!words[word]) {
				words[word] = 0;
			}
			words[word]++;
		}
	}

	this.printWords = (count) => {
		let word_array = [];
		for (let word in words) {
			word_array.push(word);
		}

		word_array.sort((w1, w2) => {
			if (words[w1] < words[w2]) return 1;
			if (words[w1] > words[w2]) return -1;
			return 0;
		});

		console.log("");
		console.log(count + " наиболее часто встречающихся слов");
		for (let i = 0; i < count; i++) {
			console.log('  ', words[word_array[i]], '-->', word_array[i]);
		}
	}
}

function RetweetsAnalyse() {
	let twits = {};

	// Функция разбития строки на слова
	function parseWords(ss) {
		const delimeters = " \"\t\n,.:;?!/-+="; // Возможные разделители слов
		const url_symbols = ":/."; // Отдельная обработка url - они считаются одним словом, даже если и содержат : / . 
		const exclude_words = [ "#" ];  // Исключения из слов
		let words = [];
		let ws = 0;
		for (let i = 0; i <= ss.length; i++) {
			if (i == ss.length || delimeters.indexOf(ss[i]) >= 0) {
				if (i > ws) {
					let word = ss.substring(ws, i);
					let is_url = word.startsWith('http') && url_symbols.indexOf(ss[i]) >= 0;
					if (!is_url) {
						if (exclude_words.indexOf(word) < 0) {
							words.push(word.toLowerCase());
						}
						ws = i + 1;
					}
				} else {
					ws = i + 1;
				}
			}
		}
		return words;
	}

	this.analyse = (twit) => {
		for (let word of parseWords(twit.content)) {
			if (!words[word]) {
				words[word] = 0;
			}
			words[word]++;
		}
	}

	this.printWords = (count) => {
		let word_array = [];
		for (let word in words) {
			word_array.push(word);
		}

		word_array.sort((w1, w2) => {
			if (words[w1] < words[w2]) return 1;
			if (words[w1] > words[w2]) return -1;
			return 0;
		});

		console.log(count + " наиболее часто встречающихся слов");
		for (let i = 0; i < count; i++) {
			console.log('  ', words[word_array[i]], '-->', word_array[i]);
		}
	}
}

const LineByLineReader = require('line-by-line'),
    lr = new LineByLineReader('./input/dataSet.csv');

const twits = [];
let line_count = 0;

const twitParser = new TwitParser();
const wordAnalysator = new WordCountAnalyse();

lr.on('error', function (err) {
	console.log('error', err);
});

lr.on('line', function (line) {
	if (line_count > 0) { // Первую строку не обрабатываем (в ней заголовок CSV файла)
		const twit = twitParser.parse(line);
		if (twit) {
			// Обрабытываем твит
			wordAnalysator.analyse(twit);
			twits.push(twit);
		}
	} 
	line_count++;
	if (line_count % 5000 == 0) {
		console.log('обработано', line_count, 'строк');
	}
});

lr.on('end', function () {
    // All lines are read, file is closed now.
    main();
});

function printRetwits(count) {
	twits.sort((t1, t2) => {
		let rt1 = Number(t1.rts);
		let rt2 = Number(t2.rts);
		if (rt1 < rt2) return 1;
		if (rt1 > rt2) return -1;
		return 0;
	});

	console.log('');
	console.log(count + " наиболее популярных твитов");
	for (let i = 0; i < count; i++) {
		const twit = twits[i];
		console.log('');
		console.log('  Автор', twit.nickname);
		console.log('  Содержимое', twit.content);
		console.log('  ', twit.rts, 'ретвитов');
	}
}

function printPopulateAuthors(count) {
	const authors = {};
	for (let twit of twits) {
		authors[twit.username] = { nickname : twit.nickname, followers : Number(twit.followers)};
	}

	let authors_array = [];
	for (let username in authors) {
		authors_array.push(username);
	}

	authors_array.sort((a1, a2) => {
		if (authors[a1].followers < authors[a2].followers) return 1;
		if (authors[a1].followers > authors[a2].followers) return -1;
		return 0;
	});

	console.log('');
	console.log(count + " наиболее популярных авторов");
	for (let i = 0; i < count; i++) {
		let author = authors[authors_array[i]];
		console.log('  ', author.followers, 'фолловеров -->', author.nickname);
	}
}

function printLanguages(count) {
	const langs = {};
	for (let twit of twits) {
		if (!langs[twit.language]) {
			langs[twit.language] = { twitCount : 0, retwitCount : 0};
		}
		// Ретвиты судя по всемы всегда стартуют с данной последоватлеьности
		if (twit.content.startsWith("RT @")) { 
			langs[twit.language].retwitCount++;
		} else {
			langs[twit.language].twitCount++;
		}
	}

	let langs_array = [];
	for (let lang in langs) {
		langs_array.push(lang);
	}

	langs_array.sort((l1, l2) => {
		if (langs[l1].twitCount < langs[l2].twitCount) return 1;
		if (langs[l1].twitCount > langs[l2].twitCount) return -1;
		return 0;
	});

	console.log("");
	console.log(count + " стран-производителей твитов");
	for (let i = 0; i < count; i++) {
		let lang = langs[langs_array[i]];
		console.log('  ', lang.twitCount, 'твитов -->', langs_array[i]);
	}

	langs_array.sort((l1, l2) => {
		if (langs[l1].retwitCount < langs[l2].retwitCount) return 1;
		if (langs[l1].retwitCount > langs[l2].retwitCount) return -1;
		return 0;
	});

	console.log("");
	console.log(count + " стран-потребителей твитов");
	for (let i = 0; i < count; i++) {
		let lang = langs[langs_array[i]];
		console.log('  ', lang.retwitCount, 'ретвитов -->', langs_array[i]);
	}
}

function main () {
	console.log('обработано', line_count, 'строк');
	console.log("");
	console.log('обработано', twits.length, 'твитов');

	wordAnalysator.printWords(10);
	printRetwits(10);
	printPopulateAuthors(10);
	printLanguages(10);
}
