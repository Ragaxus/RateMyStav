//Simple utility script to make a record for all images in a directory structure
//of known depth.
//(Why known depth? Because MongoDB's .listFiles() method appears to be unable
//to recurse. Such a shame!)

conn = new Mongo();
db = conn.getDB("stavs");

var imgRoot = './data/images';
cd(imgRoot);
imgRoot = pwd();
var imgGroups = listFiles();
var imgType;
imgGroups.forEach(function(group) {
	if (!group.isDirectory) return;
	imgType = group.baseName;
	var nav = imgRoot+'/'+imgType;
	print("Moving to " + nav);
	cd(nav);
	listFiles().forEach(function(img) {
		db.images.insert({
			type: imgType,
			path: imgType+'/'+img.baseName,
			votes: [],
			avgRating: 0
		});
	});
});
