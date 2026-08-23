from src.simulator.channel import StorageChannel
def test_passthrough():
    strands = [ "ATGC", "CGTA", "GATC" ]
    channel = StorageChannel()
    reads = channel.simulate_noise(strands)
    assert reads == strands

