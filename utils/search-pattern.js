module.exports=value=>Array.from(String(value)).map(c=>'\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c).join('');
