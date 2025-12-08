let name="abebe";
let age=24;
let mark=50;
let isStudent=true;
let hobbies=["reading","traveling","coding"];
let address={city:"Addis Abeba",country:"Ethiopia"};

console.log(name);
console.log(age); 
console.log(mark); // string
console.log(isStudent); // boolean
console.log(hobbies); // object
console.log(address); // object
let x=4;
let y=7;
let z=x+y;
console.log("sum",z);
let a=5+5;
console.log("addition",a);
let b="5"+5;
console.log("addition1",b);
let c="5"+"5";
console.log("addition2",c);
let d=20/4;
console.log("division",d);
if(age>=18){
    console.log("you are eligible to vote");
}else{
    console.log("you are not eligible to vote");
}
for(let i=0;i<hobbies.length;i++){
    console.log("hobby",hobbies[i]);
}
function greet(personName){
    console.log("hello",personName);
}
greet("abebe");
greet("susan");
greet("john");  
let marks=80;   
if(marks>=90){
    console.log("grade A");
}else if(marks>=80){
    console.log("grade B");
}else if(marks>=70){
    console.log("grade C");
}else{
    console.log("grade F");
}       
let day=6;
switch(day){
    case 1:
        console.log("monday");
        break;
    case 2:
        console.log("tuesday");
        break;
    case 3:
        console.log("wednesday");
        break;
    case 4:
        console.log("thursday");
        break;
    case 5:
        console.log("friday");
        break;
    case 6:
        console.log("saturday");
        break;
    case 7:
        console.log("sunday");
        break;
    default:
        console.log("invalid day");
}       
for (let i=1;i<=5;i++){
    console.log("Forloop:",i);
}


while(age<30){
    console.log("whileloop:",age);
    age++;
}


do{
    console.log("do-whileloop:",age);
    age++;
}while(age<32);