/**
 * Output Parsers Test Suite
 * 
 * Run with: npx tsx test-output-parsers.ts
 * Or: npm install -g tsx && tsx test-output-parsers.ts
 */

import { executeAgent } from './lib/langchain/agent-executor';

async function testJSONParser() {
  console.log('\n🧪 Test 1: JSON Parser');
  console.log('─'.repeat(60));
  
  try {
    const result = await executeAgent(
      'Return a JSON object with name: "John Doe", age: 30, and city: "New York". Make sure it\'s valid JSON.',
      {
        outputParser: {
          type: 'json',
          autoFix: true,
        },
      }
    );

    console.log('✅ Success!');
    console.log('\n📝 Raw Output:');
    console.log(result.output);
    console.log('\n📊 Parsed Output:');
    console.log(JSON.stringify(result.parsedOutput, null, 2));
    console.log('\n⏱️  Execution Time:', result.executionTime + 'ms');
    
    return result.parsedOutput !== undefined;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testStructuredParser() {
  console.log('\n🧪 Test 2: Structured Parser');
  console.log('─'.repeat(60));
  
  try {
    const result = await executeAgent(
      'Extract information from this text: "Sarah Johnson is 28 years old, lives in San Francisco, California, and her email address is sarah.johnson@example.com. She works as a Software Engineer."',
      {
        outputParser: {
          type: 'structured',
          schema: {
            name: 'The person\'s full name',
            age: 'The person\'s age as a number',
            city: 'The city where the person lives',
            state: 'The state where the person lives',
            email: 'The person\'s email address',
            job: 'The person\'s job title',
          },
          autoFix: true,
        },
      }
    );

    console.log('✅ Success!');
    console.log('\n📝 Raw Output:');
    console.log(result.output.substring(0, 200) + '...');
    console.log('\n📊 Parsed Output:');
    console.log(JSON.stringify(result.parsedOutput, null, 2));
    console.log('\n⏱️  Execution Time:', result.executionTime + 'ms');
    
    return result.parsedOutput !== undefined;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testWithoutParser() {
  console.log('\n🧪 Test 3: Without Parser (Backward Compatible)');
  console.log('─'.repeat(60));
  
  try {
    const result = await executeAgent(
      'Tell me a short joke in one sentence.',
      {
        // No outputParser - should work as before
      }
    );

    console.log('✅ Success!');
    console.log('\n📝 Output:');
    console.log(result.output);
    console.log('\n📊 Parsed Output:', result.parsedOutput); // Should be undefined
    console.log('\n⏱️  Execution Time:', result.executionTime + 'ms');
    
    return result.parsedOutput === undefined && result.output.length > 0;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testAutoFix() {
  console.log('\n🧪 Test 4: Auto-Fix Functionality');
  console.log('─'.repeat(60));
  
  try {
    const result = await executeAgent(
      'Return a JSON object with status: "ok" and count: 42. Make it valid JSON.',
      {
        outputParser: {
          type: 'json',
          autoFix: true,
        },
      }
    );

    console.log('✅ Success!');
    console.log('\n📝 Raw Output:');
    console.log(result.output);
    console.log('\n📊 Parsed Output:');
    console.log(JSON.stringify(result.parsedOutput, null, 2));
    
    const isValid = result.parsedOutput && typeof result.parsedOutput === 'object';
    console.log('\n✅ Valid JSON:', isValid);
    
    return isValid;
  } catch (error: any) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 OUTPUT PARSERS TEST SUITE');
  console.log('═'.repeat(60));

  const results = [];

  results.push(await testJSONParser());
  results.push(await testStructuredParser());
  results.push(await testWithoutParser());
  results.push(await testAutoFix());

  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${results.filter(r => r).length}/${results.length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}/${results.length}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check output above.');
  }
  
  console.log('═'.repeat(60) + '\n');
}

runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});

