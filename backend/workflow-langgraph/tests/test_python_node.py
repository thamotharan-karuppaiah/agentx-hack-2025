import pytest
from app.orchestrator.nodes.python_node import PythonNode

@pytest.fixture
def python_node():
    """Create a PythonNode instance for testing"""
    return PythonNode({})

class TestPythonNode:
    @pytest.mark.asyncio
    async def test_basic_execution(self, python_node):
        """Test basic Python code execution"""
        state = {
            "python_input": "result = 2 + 2"
        }
        result = await python_node.process(state)
        
        assert result["status"] == "success"
        assert result["python_node_output"] == {"output": 4}
        assert "code_executed" in result

    @pytest.mark.asyncio
    async def test_dict_result(self, python_node):
        """Test execution with dictionary result"""
        state = {
            "python_input": "result = {'key': 'value', 'number': 42}"
        }
        result = await python_node.process(state)
        
        assert result["status"] == "success"
        assert result["python_node_output"] == {"key": "value", "number": 42}

    @pytest.mark.asyncio
    async def test_placeholder_replacement(self, python_node):
        """Test placeholder replacement in code"""
        state = {
            "python_input": "x = {{data.value}}\nresult = x * 2",
            "webrequest_output": {"data": {"value": 5}}
        }
        result = await python_node.process(state)
        
        assert result["status"] == "success"
        assert result["python_node_output"] == {"output": 10}
        assert "x = 5" in result["code_executed"]

    @pytest.mark.asyncio
    async def test_nested_placeholder(self, python_node):
        """Test nested placeholder replacement"""
        state = {
            "python_input": "name = {{user.profile.name}}\nresult = f'Hello, {name}'",
            "webrequest_output": {
                "user": {
                    "profile": {
                        "name": "John"
                    }
                }
            }
        }
        result = await python_node.process(state)
        
        assert result["status"] == "success"
        assert result["python_node_output"] == {"output": "Hello, John"}

    @pytest.mark.asyncio
    async def test_missing_placeholder(self, python_node):
        """Test behavior with missing placeholder"""
        state = {
            "python_input": "result = {{missing.value}}",
            "webrequest_output": {"data": {}}
        }
        result = await python_node.process(state)
        
        assert result["status"] == "error"
        assert "error" in result["python_node_output"]

    @pytest.mark.asyncio
    async def test_syntax_error(self, python_node):
        """Test handling of Python syntax errors"""
        state = {
            "python_input": "result = 1 +"  # Invalid syntax
        }
        result = await python_node.process(state)
        
        assert result["status"] == "error"
        assert "error" in result["python_node_output"]

    @pytest.mark.asyncio
    async def test_runtime_error(self, python_node):
        """Test handling of runtime errors"""
        state = {
            "python_input": "result = 1 / 0"  # Division by zero
        }
        result = await python_node.process(state)
        
        assert result["status"] == "error"
        assert "error" in result["python_node_output"]

    @pytest.mark.asyncio
    async def test_missing_input(self, python_node):
        """Test behavior when python_input is missing"""
        state = {}
        result = await python_node.process(state)
        
        assert result["status"] == "error"
        assert "No Python code provided" in result["python_node_output"]["error"]

    @pytest.mark.asyncio
    async def test_state_preservation(self, python_node):
        """Test that original state is preserved and included in result"""
        state = {
            "python_input": "result = 42",
            "other_key": "other_value"
        }
        result = await python_node.process(state)
        
        assert result["other_key"] == "other_value"
        assert result["python_node_output"] == {"output": 42}

    @pytest.mark.asyncio
    async def test_complex_data_structures(self, python_node):
        """Test handling of complex data structures"""
        state = {
            "python_input": """
result = {
    'list': [1, 2, 3],
    'dict': {'nested': 'value'},
    'tuple': (4, 5, 6)
}
"""
        }
        result = await python_node.process(state)
        
        assert result["status"] == "success"
        assert "list" in result["python_node_output"]
        assert "dict" in result["python_node_output"]
        assert "tuple" in result["python_node_output"] 